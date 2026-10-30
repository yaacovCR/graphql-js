/** @category Visiting */

import { devAssert } from '../jsutils/devAssert.ts';
import { inspect } from '../jsutils/inspect.ts';

import type { ASTNode } from './ast.ts';
import { isNode, QueryDocumentKeys } from './ast.ts';
import type { Kind } from './kinds.ts';
import type { ASTReducer as VisitorReducer } from './visitor.ts';

/** @internal */
export type ASTReducer<R> = {
  readonly [K in keyof VisitorReducer<R>]-?: (
    node: Parameters<NonNullable<VisitorReducer<R>[K]>['leave']>[0],
  ) => R;
};

/**
 * Reduces children before their parents without changing the input AST.
 * Callbacks receive only the node with its children replaced by their results.
 * Returned values are data, including values that control traversal in visit().
 * @param root - The AST node to reduce.
 * @param reducer - A callback for every node kind.
 * @returns The reduced root value.
 * @typeParam R - The result produced for each node.
 * @internal
 */
export function reduce<R>(root: ASTNode, reducer: ASTReducer<R>): R {
  let stack: any;
  let node: any = root;
  let parent: any;
  let keys: any = [root];
  let index = -1;
  let inArray = true;
  let results: any = [];

  do {
    index++;
    const isLeaving = index === keys.length;
    if (isLeaving) {
      node = results;
      ({ index, keys, inArray, results, parent, prev: stack } = stack);
    } else if (parent != null) {
      node = parent[inArray ? index : keys[index]];
      if (node == null) {
        continue;
      }
    }

    const nodeIsArray = Array.isArray(node);
    devAssert(
      nodeIsArray || isNode(node),
      `Invalid AST Node: ${inspect(node)}.`,
    );
    const childKeys = nodeIsArray ? node : QueryDocumentKeys[node.kind as Kind];
    if (isLeaving || childKeys.length === 0) {
      let result = node;
      if (!nodeIsArray) {
        const reduceNode = reducer[node.kind as Kind] as (node: unknown) => R;
        result = reduceNode(node);
      }
      if (inArray) {
        results.push(result);
      } else {
        results[keys[index]] = result;
      }
    } else {
      stack = { index, keys, inArray, results, parent, prev: stack };
      index = -1;
      keys = childKeys;
      inArray = nodeIsArray;
      parent = node;
      results = nodeIsArray ? [] : { ...node };
    }
  } while (stack !== undefined);

  return results[0];
}
