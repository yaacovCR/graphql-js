import { describe, it } from 'node:test';

import { expect } from 'chai';

import type { ASTNode } from '../ast.ts';
import { parse, parseValue } from '../parser.ts';
import type { ASTReducer } from '../reducer.ts';
import { reduce } from '../reducer.ts';
import { BREAK } from '../visitor.ts';

describe('reduce', () => {
  it('rejects invalid nodes', () => {
    expect(() => reduce({} as ASTNode, {} as ASTReducer<never>)).to.throw(
      'Invalid AST Node: {}.',
    );
  });

  it('reduces children before their parent', () => {
    const ast = parse('{ a b { c } }', { noLocation: true });
    const snapshot = JSON.stringify(ast);
    const reducer: Partial<ASTReducer<number>> = {
      Name: () => 1,
      Field: (node) => node.name + (node.selectionSet ?? 0),
      SelectionSet: (node) =>
        node.selections.reduce((sum, value) => sum + value, 0),
      OperationDefinition: (node) => node.selectionSet,
      Document: (node) =>
        node.definitions.reduce((sum, value) => sum + value, 0),
    };
    const count = reduce(ast, reducer as ASTReducer<number>);
    expect(count).to.equal(3);
    expect(JSON.stringify(ast)).to.equal(snapshot);
  });
  for (const [label, value] of [
    ['false', false],
    ['null', null],
    ['undefined', undefined],
    ['BREAK', BREAK],
  ] as const) {
    it(`retains ${label} as a reduced value`, () => {
      const reducer: Partial<ASTReducer<unknown>> = {
        IntValue: () => value,
        ListValue: (node) => node.values,
      };
      expect(reduce(parseValue('1'), reducer as ASTReducer<unknown>)).to.equal(
        value,
      );
      expect(
        reduce(parseValue('[1, 2]'), reducer as ASTReducer<unknown>),
      ).to.deep.equal([value, value]);
      const parentReducer: Partial<ASTReducer<unknown>> = {
        ...reducer,
        ListValue: () => value,
      };
      expect(
        reduce(parseValue('[1, 2]'), parentReducer as ASTReducer<unknown>),
      ).to.equal(value);
    });
  }
});
