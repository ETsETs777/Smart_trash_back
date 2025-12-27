import { Plugin } from '@nestjs/apollo'
import { GraphQLError } from 'graphql'

/**
 * GraphQL Query Complexity Plugin
 * Prevents expensive queries by limiting query complexity
 */
@Plugin()
export class GraphQLComplexityPlugin {
  private readonly MAX_COMPLEXITY = 1000
  private readonly MAX_DEPTH = 10

  requestDidStart() {
    return {
      didResolveOperation({ request, document }: any) {
        const complexity = this.calculateComplexity(document, request.operationName)
        const depth = this.calculateDepth(document)

        if (complexity > this.MAX_COMPLEXITY) {
          throw new GraphQLError(
            `Query complexity of ${complexity} exceeds maximum allowed complexity of ${this.MAX_COMPLEXITY}`,
            {
              extensions: {
                code: 'QUERY_COMPLEXITY_EXCEEDED',
                complexity,
                maxComplexity: this.MAX_COMPLEXITY,
              },
            },
          )
        }

        if (depth > this.MAX_DEPTH) {
          throw new GraphQLError(
            `Query depth of ${depth} exceeds maximum allowed depth of ${this.MAX_DEPTH}`,
            {
              extensions: {
                code: 'QUERY_DEPTH_EXCEEDED',
                depth,
                maxDepth: this.MAX_DEPTH,
              },
            },
          )
        }
      },
    }
  }

  /**
   * Calculate query complexity
   * Simple implementation: count fields and multiply by list multipliers
   */
  private calculateComplexity(document: any, operationName?: string): number {
    let complexity = 0

    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation) return 0

    const countFields = (selectionSet: any, multiplier = 1): number => {
      if (!selectionSet || !selectionSet.selections) return 0

      let fieldCount = 0

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field') {
          fieldCount += multiplier

          // Check for list/connection patterns
          if (selection.name.value.endsWith('s') || selection.name.value.includes('Connection')) {
            // Likely a list field - increase complexity
            const listMultiplier = 2
            if (selection.selectionSet) {
              fieldCount += countFields(selection.selectionSet, multiplier * listMultiplier)
            }
          } else if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        }
      }

      return fieldCount
    }

    if (operation.selectionSet) {
      complexity = countFields(operation.selectionSet)
    }

    return complexity
  }

  /**
   * Calculate query depth
   */
  private calculateDepth(document: any, operationName?: string): number {
    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation || !operation.selectionSet) return 0

    const getDepth = (selectionSet: any, currentDepth = 0): number => {
      if (!selectionSet || !selectionSet.selections) return currentDepth

      let maxDepth = currentDepth

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field' && selection.selectionSet) {
          const depth = getDepth(selection.selectionSet, currentDepth + 1)
          maxDepth = Math.max(maxDepth, depth)
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            const depth = getDepth(selection.selectionSet, currentDepth + 1)
            maxDepth = Math.max(maxDepth, depth)
          }
        }
      }

      return maxDepth
    }

    return getDepth(operation.selectionSet)
  }
}

import { GraphQLError } from 'graphql'

/**
 * GraphQL Query Complexity Plugin
 * Prevents expensive queries by limiting query complexity
 */
@Plugin()
export class GraphQLComplexityPlugin {
  private readonly MAX_COMPLEXITY = 1000
  private readonly MAX_DEPTH = 10

  requestDidStart() {
    return {
      didResolveOperation({ request, document }: any) {
        const complexity = this.calculateComplexity(document, request.operationName)
        const depth = this.calculateDepth(document)

        if (complexity > this.MAX_COMPLEXITY) {
          throw new GraphQLError(
            `Query complexity of ${complexity} exceeds maximum allowed complexity of ${this.MAX_COMPLEXITY}`,
            {
              extensions: {
                code: 'QUERY_COMPLEXITY_EXCEEDED',
                complexity,
                maxComplexity: this.MAX_COMPLEXITY,
              },
            },
          )
        }

        if (depth > this.MAX_DEPTH) {
          throw new GraphQLError(
            `Query depth of ${depth} exceeds maximum allowed depth of ${this.MAX_DEPTH}`,
            {
              extensions: {
                code: 'QUERY_DEPTH_EXCEEDED',
                depth,
                maxDepth: this.MAX_DEPTH,
              },
            },
          )
        }
      },
    }
  }

  /**
   * Calculate query complexity
   * Simple implementation: count fields and multiply by list multipliers
   */
  private calculateComplexity(document: any, operationName?: string): number {
    let complexity = 0

    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation) return 0

    const countFields = (selectionSet: any, multiplier = 1): number => {
      if (!selectionSet || !selectionSet.selections) return 0

      let fieldCount = 0

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field') {
          fieldCount += multiplier

          // Check for list/connection patterns
          if (selection.name.value.endsWith('s') || selection.name.value.includes('Connection')) {
            // Likely a list field - increase complexity
            const listMultiplier = 2
            if (selection.selectionSet) {
              fieldCount += countFields(selection.selectionSet, multiplier * listMultiplier)
            }
          } else if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        }
      }

      return fieldCount
    }

    if (operation.selectionSet) {
      complexity = countFields(operation.selectionSet)
    }

    return complexity
  }

  /**
   * Calculate query depth
   */
  private calculateDepth(document: any, operationName?: string): number {
    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation || !operation.selectionSet) return 0

    const getDepth = (selectionSet: any, currentDepth = 0): number => {
      if (!selectionSet || !selectionSet.selections) return currentDepth

      let maxDepth = currentDepth

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field' && selection.selectionSet) {
          const depth = getDepth(selection.selectionSet, currentDepth + 1)
          maxDepth = Math.max(maxDepth, depth)
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            const depth = getDepth(selection.selectionSet, currentDepth + 1)
            maxDepth = Math.max(maxDepth, depth)
          }
        }
      }

      return maxDepth
    }

    return getDepth(operation.selectionSet)
  }
}

import { GraphQLError } from 'graphql'

/**
 * GraphQL Query Complexity Plugin
 * Prevents expensive queries by limiting query complexity
 */
@Plugin()
export class GraphQLComplexityPlugin {
  private readonly MAX_COMPLEXITY = 1000
  private readonly MAX_DEPTH = 10

  requestDidStart() {
    return {
      didResolveOperation({ request, document }: any) {
        const complexity = this.calculateComplexity(document, request.operationName)
        const depth = this.calculateDepth(document)

        if (complexity > this.MAX_COMPLEXITY) {
          throw new GraphQLError(
            `Query complexity of ${complexity} exceeds maximum allowed complexity of ${this.MAX_COMPLEXITY}`,
            {
              extensions: {
                code: 'QUERY_COMPLEXITY_EXCEEDED',
                complexity,
                maxComplexity: this.MAX_COMPLEXITY,
              },
            },
          )
        }

        if (depth > this.MAX_DEPTH) {
          throw new GraphQLError(
            `Query depth of ${depth} exceeds maximum allowed depth of ${this.MAX_DEPTH}`,
            {
              extensions: {
                code: 'QUERY_DEPTH_EXCEEDED',
                depth,
                maxDepth: this.MAX_DEPTH,
              },
            },
          )
        }
      },
    }
  }

  /**
   * Calculate query complexity
   * Simple implementation: count fields and multiply by list multipliers
   */
  private calculateComplexity(document: any, operationName?: string): number {
    let complexity = 0

    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation) return 0

    const countFields = (selectionSet: any, multiplier = 1): number => {
      if (!selectionSet || !selectionSet.selections) return 0

      let fieldCount = 0

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field') {
          fieldCount += multiplier

          // Check for list/connection patterns
          if (selection.name.value.endsWith('s') || selection.name.value.includes('Connection')) {
            // Likely a list field - increase complexity
            const listMultiplier = 2
            if (selection.selectionSet) {
              fieldCount += countFields(selection.selectionSet, multiplier * listMultiplier)
            }
          } else if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            fieldCount += countFields(selection.selectionSet, multiplier)
          }
        }
      }

      return fieldCount
    }

    if (operation.selectionSet) {
      complexity = countFields(operation.selectionSet)
    }

    return complexity
  }

  /**
   * Calculate query depth
   */
  private calculateDepth(document: any, operationName?: string): number {
    const operation = document.definitions.find(
      (def: any) => def.kind === 'OperationDefinition' && (!operationName || def.name?.value === operationName),
    )

    if (!operation || !operation.selectionSet) return 0

    const getDepth = (selectionSet: any, currentDepth = 0): number => {
      if (!selectionSet || !selectionSet.selections) return currentDepth

      let maxDepth = currentDepth

      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field' && selection.selectionSet) {
          const depth = getDepth(selection.selectionSet, currentDepth + 1)
          maxDepth = Math.max(maxDepth, depth)
        } else if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
          if (selection.selectionSet) {
            const depth = getDepth(selection.selectionSet, currentDepth + 1)
            maxDepth = Math.max(maxDepth, depth)
          }
        }
      }

      return maxDepth
    }

    return getDepth(operation.selectionSet)
  }
}


