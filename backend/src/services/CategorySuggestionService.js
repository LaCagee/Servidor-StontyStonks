// ============================================
// SERVICIO DE SUGERENCIAS DE CATEGORÍAS (MEJORADO)
// ============================================
const { CATEGORY_KEYWORDS, getKeywordsForCategory } = require('../config/categorykeywords');
const { Category } = require('../models');

/**
 * ALGORITMO DE SUGERENCIA DE CATEGORÍAS - VERSIÓN MEJORADA
 * 
 * Mejoras implementadas:
 * 1. Stop words (palabras genéricas ignoradas)
 * 2. Pesos diferentes según tipo de coincidencia
 * 3. Bonus por keywords específicas (marcas, nombres propios)
 * 4. Penalización por palabras muy comunes
 */

class CategorySuggestionService {
    // ========== STOP WORDS (palabras a ignorar) ==========
    static STOP_WORDS = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'de', 'del', 'al', 'en', 'con', 'sin', 'por', 'para',
        'a', 'y', 'o', 'pero', 'que', 'es', 'no', 'si',
        'centro', 'lugar', 'local', 'tienda', 'compra', 'pago'
    ]);

    // Palabras de alta especificidad (marcas, nombres únicos)
    static HIGH_SPECIFICITY_KEYWORDS = new Set([
        'uber', 'didi', 'cabify', 'beat', 'netflix', 'spotify', 'disney',
        'jumbo', 'lider', 'tottus', 'unimarc', 'santa isabel',
        'copec', 'shell', 'esso', 'enel', 'cge', 'movistar', 'entel',
        'falabella', 'ripley', 'paris', 'sodimac', 'easy',
        'cruz verde', 'salcobrand', 'ahumada'
    ]);

    /**
     * Normalizar texto: lowercase, remover acentos, remover caracteres especiales
     * @param {string} text - Texto a normalizar
     * @returns {string} Texto normalizado
     */
    static normalizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extraer palabras individuales de un texto (excluyendo stop words)
     * @param {string} text - Texto normalizado
     * @returns {string[]} Array de palabras filtradas
     */
    static extractWords(text) {
        if (!text) return [];
        return text
            .split(' ')
            .filter(word => word.length > 0 && !this.STOP_WORDS.has(word));
    }

    /**
     * Verificar si una keyword es de alta especificidad
     * @param {string} keyword - Palabra clave
     * @returns {boolean}
     */
    static isHighSpecificityKeyword(keyword) {
        return this.HIGH_SPECIFICITY_KEYWORDS.has(this.normalizeText(keyword));
    }

    /**
     * Calcular puntaje de coincidencia entre descripción y keywords de una categoría
     * VERSIÓN MEJORADA con pesos diferenciados
     * @param {string} description - Descripción de la transacción
     * @param {number} categoryId - ID de la categoría
     * @returns {number} Puntaje (0-100)
     */
    static calculateCategoryScore(description, categoryId) {
        const normalizedDescription = this.normalizeText(description);
        const words = this.extractWords(normalizedDescription);
        const keywords = getKeywordsForCategory(categoryId);

        if (words.length === 0 || keywords.length === 0) {
            return 0;
        }

        let score = 0;
        const foundKeywords = new Set();
        let hasHighSpecificityMatch = false;

        // Iterar sobre cada palabra de la descripción
        words.forEach((word, index) => {
            let bestMatchScore = 0;
            let bestMatchKeyword = null;

            keywords.forEach((keyword) => {
                const normalizedKeyword = this.normalizeText(keyword);

                // COINCIDENCIA EXACTA
                if (word === normalizedKeyword) {
                    let matchScore = 0;

                    // Alta especificidad (marcas, nombres únicos): 25 puntos
                    if (this.isHighSpecificityKeyword(keyword)) {
                        matchScore = 25;
                        hasHighSpecificityMatch = true;
                    }
                    // Palabras largas (>5 caracteres): 15 puntos
                    else if (word.length > 5) {
                        matchScore = 15;
                    }
                    // Palabras normales: 10 puntos
                    else {
                        matchScore = 10;
                    }

                    // BONUS: Si está al inicio (primeras 2 palabras)
                    if (index < 2) {
                        matchScore += 5;
                    }

                    if (matchScore > bestMatchScore) {
                        bestMatchScore = matchScore;
                        bestMatchKeyword = normalizedKeyword;
                    }
                }
                // COINCIDENCIA PARCIAL (contiene)
                else if (word.length > 3 && normalizedKeyword.length > 3) {
                    // Palabra contiene la keyword
                    if (word.includes(normalizedKeyword)) {
                        const matchScore = 5;
                        if (matchScore > bestMatchScore) {
                            bestMatchScore = matchScore;
                            bestMatchKeyword = normalizedKeyword;
                        }
                    }
                    // Keyword contiene la palabra (solo si es significativa)
                    else if (normalizedKeyword.includes(word) && word.length > 4) {
                        const matchScore = 4;
                        if (matchScore > bestMatchScore) {
                            bestMatchScore = matchScore;
                            bestMatchKeyword = normalizedKeyword;
                        }
                    }
                }
            });

            if (bestMatchScore > 0 && bestMatchKeyword) {
                score += bestMatchScore;
                foundKeywords.add(bestMatchKeyword);
            }
        });

        // BONUS: Múltiples keywords encontradas (diversidad)
        if (foundKeywords.size > 1) {
            score += foundKeywords.size * 3;
        }

        // BONUS EXTRA: Si hay coincidencia de alta especificidad
        if (hasHighSpecificityMatch) {
            score += 10;
        }

        // Normalizar puntaje a escala 0-100
        // Ajustamos el máximo posible basado en el nuevo sistema de pesos
        const maxPossibleScore = words.length * 30 + 25; // Máximo teórico
        const normalizedScore = Math.min(100, (score / maxPossibleScore) * 100);

        return Math.round(normalizedScore * 100) / 100;
    }

    /**
     * Sugerir categorías basadas en la descripción de la transacción
     * @param {string} description - Descripción de la transacción
     * @param {string} type - Tipo de transacción ('income' o 'expense')
     * @param {number} maxSuggestions - Número máximo de sugerencias (default: 3)
     * @param {number} minScore - Puntaje mínimo para considerar una sugerencia (default: 10)
     * @returns {Promise<Array>} Array de sugerencias ordenadas por puntaje
     */
    static async suggestCategories(description, type, maxSuggestions = 3, minScore = 10) {
        try {
            // Validar entrada
            if (!description || typeof description !== 'string') {
                return [];
            }

            if (!['income', 'expense'].includes(type)) {
                throw new Error('El tipo debe ser "income" o "expense"');
            }

            // Obtener categorías del tipo especificado
            const categories = await Category.findAll({
                where: {
                    isActive: true
                }
            });

            // Filtrar por tipo (incluir 'both' también)
            const relevantCategories = categories.filter(cat =>
                cat.type === type || cat.type === 'both'
            );

            // Calcular puntajes para cada categoría
            const suggestions = relevantCategories
                .map(category => {
                    const score = this.calculateCategoryScore(description, category.id);
                    return {
                        categoryId: category.id,
                        categoryName: category.name,
                        categoryIcon: category.icon,
                        categoryColor: category.color,
                        categoryType: category.type,
                        score,
                        confidence: this.getConfidenceLevel(score)
                    };
                })
                .filter(suggestion => suggestion.score >= minScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, maxSuggestions);

            return suggestions;

        } catch (error) {
            console.error('Error en suggestCategories:', error);
            throw error;
        }
    }

    /**
     * Obtener nivel de confianza basado en el puntaje
     * @param {number} score - Puntaje (0-100)
     * @returns {string} Nivel de confianza ('high', 'medium', 'low')
     */
    static getConfidenceLevel(score) {
        if (score >= 50) return 'high';
        if (score >= 20) return 'medium';
        return 'low';
    }

    /**
     * Sugerir categoría única (la mejor coincidencia)
     * @param {string} description - Descripción de la transacción
     * @param {string} type - Tipo de transacción
     * @returns {Promise<Object|null>} Mejor sugerencia o null
     */
    static async suggestBestCategory(description, type) {
        const suggestions = await this.suggestCategories(description, type, 1, 10);
        return suggestions.length > 0 ? suggestions[0] : null;
    }

    /**
     * Validar si una categoría es apropiada para un tipo de transacción
     * @param {number} categoryId - ID de la categoría
     * @param {string} type - Tipo de transacción
     * @returns {Promise<boolean>}
     */
    static async isCategoryValidForType(categoryId, type) {
        const category = await Category.findByPk(categoryId);

        if (!category || !category.isActive) {
            return false;
        }

        return category.type === type || category.type === 'both';
    }

    /**
     * Obtener estadísticas de keywords (útil para debugging)
     * @returns {Object} Estadísticas del diccionario
     */
    static getKeywordStats() {
        const stats = {
            totalCategories: Object.keys(CATEGORY_KEYWORDS).length,
            totalKeywords: 0,
            categoriesWithKeywords: 0,
            avgKeywordsPerCategory: 0,
            stopWordsCount: this.STOP_WORDS.size,
            highSpecificityCount: this.HIGH_SPECIFICITY_KEYWORDS.size,
            categoryDetails: {}
        };

        Object.entries(CATEGORY_KEYWORDS).forEach(([categoryId, keywords]) => {
            stats.totalKeywords += keywords.length;

            if (keywords.length > 0) {
                stats.categoriesWithKeywords++;
            }

            stats.categoryDetails[categoryId] = {
                keywordCount: keywords.length,
                sampleKeywords: keywords.slice(0, 5)
            };
        });

        stats.avgKeywordsPerCategory = Math.round(
            stats.totalKeywords / stats.totalCategories
        );

        return stats;
    }

    /**
     * Probar sugerencias con múltiples descripciones de ejemplo
     * @param {Array<string>} descriptions - Array de descripciones
     * @param {string} type - Tipo de transacción
     * @returns {Promise<Array>} Resultados de las pruebas
     */
    static async testSuggestions(descriptions, type) {
        const results = [];

        for (const description of descriptions) {
            const suggestions = await this.suggestCategories(description, type);

            results.push({
                description,
                suggestions: suggestions.length > 0 ? suggestions : 'Sin sugerencias',
                bestMatch: suggestions.length > 0 ? suggestions[0] : null
            });
        }
 
        return results;
    }
}

module.exports = CategorySuggestionService;