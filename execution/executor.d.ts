import type {
  DocumentNode,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLLeafType,
  GraphQLAbstractType,
  GraphQLField,
  GraphQLFieldResolver,
  GraphQLResolveInfo,
  GraphQLTypeResolver,
  GraphQLList,
  OperationDefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
} from 'graphql';
import { GraphQLError } from 'graphql';
import type { Path } from '../jsutils/Path';
import type { ObjMap } from '../jsutils/ObjMap';
import type { PromiseOrValue } from '../jsutils/PromiseOrValue';
import type { Maybe } from '../jsutils/Maybe';
import type { Push, Stop } from '../jsutils/repeater';
import type { FieldsAndPatches, PatchFields } from './collectFields';
/**
 * Terminology
 *
 * "Definitions" are the generic name for top-level statements in the document.
 * Examples of this include:
 * 1) Operations (such as a query)
 * 2) Fragments
 *
 * "Operations" are a generic name for requests in the document.
 * Examples of this include:
 * 1) query,
 * 2) mutation
 *
 * "Selections" are the definitions that can appear legally and at
 * single level of the query. These include:
 * 1) field references e.g `a`
 * 2) fragment "spreads" e.g. `...c`
 * 3) inline fragment "spreads" e.g. `...on Type { a }`
 */
/**
 * Data that must be available at all points during query execution.
 *
 * Namely, schema of the type system that is currently executing,
 * and the fragments defined in the query document
 */
interface ExecutionContext {
  schema: GraphQLSchema;
  fragments: ObjMap<FragmentDefinitionNode>;
  rootValue: unknown;
  contextValue: unknown;
  operation: OperationDefinitionNode;
  variableValues: {
    [variable: string]: unknown;
  };
  fieldResolver: GraphQLFieldResolver<any, any>;
  typeResolver: GraphQLTypeResolver<any, any>;
  forceQueryAlgorithm: boolean;
  disableIncremental: boolean;
  resolveField: FieldResolver;
  rootPayloadContext: PayloadContext;
  iterators: Set<AsyncIterator<unknown>>;
  publisher: Publisher | undefined;
  pendingPushes: number;
  pushedPayloads: WeakMap<PayloadContext, boolean>;
  pendingPayloads: WeakMap<PayloadContext, Array<IncrementalResult>>;
}
interface PayloadContext {
  errors: Array<GraphQLError>;
  label?: string;
}
interface IncrementalResult {
  payloadContext: PayloadContext;
  data: ObjMap<unknown> | unknown | null;
  path: Path | undefined;
}
interface Publisher {
  push: Push<ExecutionPatchResult>;
  stop: Stop;
}
export interface ExecutionArgs {
  schema: GraphQLSchema;
  document: DocumentNode;
  rootValue?: unknown;
  contextValue?: unknown;
  variableValues?: Maybe<{
    readonly [variable: string]: unknown;
  }>;
  operationName?: Maybe<string>;
  fieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  typeResolver?: Maybe<GraphQLTypeResolver<any, any>>;
  subscribeFieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  forceQueryAlgorithm?: Maybe<boolean>;
  disableIncremental?: Maybe<boolean>;
}
/**
 * The result of GraphQL execution.
 *
 *   - `errors` is included when any errors occurred as a non-empty array.
 *   - `data` is the result of a successful execution of the query.
 *   - `hasNext` is true if a future payload is expected.
 *   - `extensions` is reserved for adding non-standard properties.
 */
export interface ExecutionResult<
  TData = ObjMap<unknown>,
  TExtensions = ObjMap<unknown>,
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: TData | null;
  hasNext?: boolean;
  extensions?: TExtensions;
}
/**
 * The result of an asynchronous GraphQL patch.
 *
 *   - `errors` is included when any errors occurred as a non-empty array.
 *   - `data` is the result of the additional asynchronous data.
 *   - `path` is the location of data.
 *   - `label` is the label provided to `@defer` or `@stream`.
 *   - `hasNext` is true if a future payload is expected.
 *   - `extensions` is reserved for adding non-standard properties.
 */
export interface ExecutionPatchResult<
  TData = ObjMap<unknown> | unknown,
  TExtensions = ObjMap<unknown>,
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: TData | null;
  path?: ReadonlyArray<string | number>;
  label?: string;
  hasNext: boolean;
  extensions?: TExtensions;
}
export declare type AsyncExecutionResult =
  | ExecutionResult
  | ExecutionPatchResult;
export declare type FieldsExecutor = (
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  sourceValue: unknown,
  path: Path | undefined,
  fields: Map<string, ReadonlyArray<FieldNode>>,
  payloadContext: PayloadContext,
) => PromiseOrValue<ObjMap<unknown>>;
export declare type FieldResolver = (
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<unknown, unknown>,
  source: unknown,
  info: GraphQLResolveInfo,
  fieldNodes: ReadonlyArray<FieldNode>,
) => unknown;
/**
 * Executor class responsible for implementing the Execution section of the GraphQL spec.
 *
 * This class is exported only to assist people in implementing their own executors
 * without duplicating too much code and should be used only as last resort for cases
 * such as experimental syntax or if certain features could not be contributed upstream.
 *
 * It is still part of the internal API and is versioned, so any changes to it are never
 * considered breaking changes. If you still need to support multiple versions of the
 * library, please use the `versionInfo` variable for version detection.
 *
 * @internal
 */
export declare class Executor {
  /**
   * A memoized collection of relevant subfields with regard to the return
   * type. Memoizing ensures the subfields are not repeatedly calculated, which
   * saves overhead when resolving lists of values.
   */
  collectSubfields: (
    a1: ExecutionContext,
    a2: GraphQLObjectType<any, any>,
    a3: readonly FieldNode[],
  ) => FieldsAndPatches;
  /**
   * A memoized collection of field argument values.
   * Memoizing ensures the subfields are not repeatedly calculated, which
   * saves overhead when resolving lists of values.
   */
  getArgumentValues: (
    a1: GraphQLField<unknown, unknown, any>,
    a2: FieldNode,
    a3: ObjMap<unknown>,
  ) => {
    [argument: string]: unknown;
  };
  /**
   * Implements the "Executing requests" section of the spec.
   */
  execute(
    args: ExecutionArgs,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  createSourceEventStream(
    args: ExecutionArgs,
  ): Promise<AsyncIterable<unknown> | ExecutionResult>;
  executeImpl(
    exeContext: ExecutionContext,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  executeQueryImpl(
    exeContext: ExecutionContext,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  /**
   * Implements the ExecuteQuery algorithm described in the GraphQL
   * specification. This algorithm is used to execute query operations
   * and to implement the ExecuteSubscriptionEvent algorith,
   *
   * If errors are encountered while executing a GraphQL field, only that
   * field and its descendants will be omitted, and sibling fields will still
   * be executed. An execution which encounters errors will still result in a
   * resolved Promise.
   *
   * Errors from sub-fields of a NonNull type may propagate to the top level,
   * at which point we still log the error and null the parent field, which
   * in this case is the entire response.
   */
  executeQueryAlgorithm(
    exeContext: ExecutionContext,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  /**
   * Implements the ExecuteMutation algorithm described in the Graphql
   * specification.
   */
  executeMutationImpl(
    exeContext: ExecutionContext,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  /**
   * Implements the Execute algorithm described in the GraphQL specification
   * for queries/mutations, using the provided parallel or serial fields
   * executor.
   */
  executeQueryOrMutationImpl(
    exeContext: ExecutionContext,
    fieldsExecutor: FieldsExecutor,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  /**
   * Given a completed execution context and data, build the `{ errors, data }`
   * response defined by the "Response" section of the GraphQL specification.
   */
  buildResponse(
    exeContext: ExecutionContext,
    data: ObjMap<unknown> | null,
  ): ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>;
  /**
   * Essential assertions before executing to provide developer feedback for
   * improper use of the GraphQL library.
   */
  assertValidExecutionArguments(
    schema: GraphQLSchema,
    document: DocumentNode,
    rawVariableValues: Maybe<{
      readonly [variable: string]: unknown;
    }>,
  ): void;
  buildFieldResolver: (
    resolverKey: 'resolve' | 'subscribe',
    defaultResolver: GraphQLFieldResolver<unknown, unknown>,
  ) => (
    exeContext: ExecutionContext,
    fieldDef: GraphQLField<unknown, unknown>,
    source: unknown,
    info: GraphQLResolveInfo,
    fieldNodes: ReadonlyArray<FieldNode>,
  ) => unknown;
  /**
   * Constructs a ExecutionContext object from the arguments passed to
   * execute, which we will pass throughout the other execution methods.
   *
   * Returns an array of GraphQLErrors if a valid execution context
   * cannot be created.
   */
  buildExecutionContext(
    args: ExecutionArgs,
  ): ReadonlyArray<GraphQLError> | ExecutionContext;
  /**
   * Constructs a perPayload ExecutionContext object from an initial
   * ExecutionObject and the payload value.
   */
  buildPerPayloadExecutionContext(
    exeContext: ExecutionContext,
    payload: unknown,
  ): ExecutionContext;
  /**
   * Executes the root fields specified by the operation.
   */
  executeRootFields(
    exeContext: ExecutionContext,
    fieldsExecutor: FieldsExecutor,
  ): PromiseOrValue<ObjMap<unknown> | null>;
  parseOperationRoot(
    schema: GraphQLSchema,
    fragments: ObjMap<FragmentDefinitionNode>,
    variableValues: {
      [variable: string]: unknown;
    },
    operation: OperationDefinitionNode,
    disableIncremental: boolean,
  ): {
    rootType: GraphQLObjectType;
    fieldsAndPatches: FieldsAndPatches;
  };
  /**
   * Implements the "Executing selection sets" section of the spec
   * for fields that must be executed serially.
   */
  executeFieldsSerially(
    exeContext: ExecutionContext,
    parentType: GraphQLObjectType,
    sourceValue: unknown,
    path: Path | undefined,
    fields: Map<string, ReadonlyArray<FieldNode>>,
  ): PromiseOrValue<ObjMap<unknown>>;
  /**
   * Implements the "Executing selection sets" section of the spec
   * for fields that may be executed in parallel.
   */
  executeFields(
    exeContext: ExecutionContext,
    parentType: GraphQLObjectType,
    sourceValue: unknown,
    path: Path | undefined,
    fields: Map<string, ReadonlyArray<FieldNode>>,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ObjMap<unknown>>;
  /**
   * Implements the "Executing field" section of the spec
   * In particular, this function figures out the value that the field returns by
   * calling its resolve function, then calls completeValue to complete promises,
   * serialize scalars, or execute the sub-selection-set for objects.
   */
  executeField(
    exeContext: ExecutionContext,
    parentType: GraphQLObjectType,
    source: unknown,
    fieldNodes: ReadonlyArray<FieldNode>,
    path: Path,
    payloadContext: PayloadContext,
  ): PromiseOrValue<unknown>;
  buildResolveInfo(
    exeContext: ExecutionContext,
    fieldDef: GraphQLField<unknown, unknown>,
    fieldNodes: ReadonlyArray<FieldNode>,
    parentType: GraphQLObjectType,
    path: Path,
  ): GraphQLResolveInfo;
  handleFieldError(
    error: GraphQLError,
    returnType: GraphQLOutputType,
    errors: Array<GraphQLError>,
  ): null;
  /**
   * Implements the instructions for completeValue as defined in the
   * "Field entries" section of the spec.
   *
   * If the field type is Non-Null, then this recursively completes the value
   * for the inner type. It throws a field error if that completion returns null,
   * as per the "Nullability" section of the spec.
   *
   * If the field type is a List, then this recursively completes the value
   * for the inner type on each item in the list.
   *
   * If the field type is a Scalar or Enum, ensures the completed value is a legal
   * value of the type by calling the `serialize` method of GraphQL type
   * definition.
   *
   * If the field is an abstract type, determine the runtime type of the value
   * and then complete based on that type
   *
   * Otherwise, the field type expects a sub-selection set, and will complete the
   * value by executing all sub-selections.
   */
  completeValue(
    exeContext: ExecutionContext,
    returnType: GraphQLOutputType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    result: unknown,
    payloadContext: PayloadContext,
  ): PromiseOrValue<unknown>;
  /**
   * Complete a list value by completing each item in the list with the
   * inner type
   */
  completeListValue(
    exeContext: ExecutionContext,
    returnType: GraphQLList<GraphQLOutputType>,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    result: unknown,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ReadonlyArray<unknown>>;
  /**
   * Returns an object containing the `@stream` arguments if a field should be
   * streamed based on the experimental flag, stream directive present and
   * not disabled by the "if" argument.
   */
  getStreamValues(
    exeContext: ExecutionContext,
    fieldNodes: ReadonlyArray<FieldNode>,
  ):
    | undefined
    | {
        initialCount?: number;
        label?: string;
      };
  /**
   * Complete an iterator value by completing each result.
   */
  completeIteratorValue(
    exeContext: ExecutionContext,
    itemType: GraphQLOutputType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    iterator: Iterator<unknown>,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ReadonlyArray<unknown>>;
  /**
   * Complete an async iterator value by completing each result.
   */
  completeAsyncIteratorValue(
    exeContext: ExecutionContext,
    itemType: GraphQLOutputType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    iterator: AsyncIterator<unknown>,
    payloadContext: PayloadContext,
  ): Promise<ReadonlyArray<unknown>>;
  completeListItemValue(
    completedResults: Array<unknown>,
    index: number,
    promises: Array<Promise<void>>,
    item: unknown,
    exeContext: ExecutionContext,
    itemType: GraphQLOutputType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    itemPath: Path,
    payloadContext: PayloadContext,
  ): void;
  /**
   * Complete a Scalar or Enum by serializing to a valid value, returning
   * null if serialization is not possible.
   */
  completeLeafValue(returnType: GraphQLLeafType, result: unknown): unknown;
  /**
   * Complete a value of an abstract type by determining the runtime object type
   * of that value, then complete the value for that type.
   */
  completeAbstractValue(
    exeContext: ExecutionContext,
    returnType: GraphQLAbstractType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    result: unknown,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ObjMap<unknown>>;
  ensureValidRuntimeType(
    runtimeTypeOrName: unknown,
    exeContext: ExecutionContext,
    returnType: GraphQLAbstractType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    result: unknown,
  ): GraphQLObjectType;
  /**
   * Complete an Object value by executing all sub-selections.
   */
  completeObjectValue(
    exeContext: ExecutionContext,
    returnType: GraphQLObjectType,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    path: Path,
    result: unknown,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ObjMap<unknown>>;
  invalidReturnTypeError(
    returnType: GraphQLObjectType,
    result: unknown,
    fieldNodes: ReadonlyArray<FieldNode>,
  ): GraphQLError;
  collectAndExecuteSubfields(
    exeContext: ExecutionContext,
    returnType: GraphQLObjectType,
    fieldNodes: ReadonlyArray<FieldNode>,
    path: Path,
    result: unknown,
    payloadContext: PayloadContext,
  ): PromiseOrValue<ObjMap<unknown>>;
  /**
   * This method looks up the field on the given type definition.
   * It has special casing for the three introspection fields,
   * __schema, __type and __typename. __typename is special because
   * it can always be queried as a field, even in situations where no
   * other fields are allowed, like on a Union. __schema and __type
   * could get automatically added to the query type, but that would
   * require mutating type definitions, which would cause issues.
   *
   */
  getFieldDef(
    schema: GraphQLSchema,
    parentType: GraphQLObjectType,
    fieldNode: FieldNode,
  ): Maybe<GraphQLField<unknown, unknown>>;
  /**
   * Implements the "Subscribe" algorithm described in the GraphQL specification.
   *
   * Returns a Promise which resolves to either an AsyncIterator (if successful)
   * or an ExecutionResult (error). The promise will be rejected if the schema or
   * other arguments to this function are invalid, or if the resolved event stream
   * is not an async iterable.
   *
   * If the client-provided arguments to this function do not result in a
   * compliant subscription, a GraphQL Response (ExecutionResult) with
   * descriptive errors and no data will be returned.
   *
   * If the source stream could not be created due to faulty subscription
   * resolver logic or underlying systems, the promise will resolve to a single
   * ExecutionResult containing `errors` and no `data`.
   *
   * If the operation succeeded, the promise resolves to an AsyncIterator, which
   * yields a stream of ExecutionResults representing the response stream.
   *
   * Accepts either an object with named arguments, or individual arguments.
   */
  executeSubscriptionImpl(
    exeContext: ExecutionContext,
  ): Promise<
    AsyncGenerator<AsyncExecutionResult, void, void> | ExecutionResult
  >;
  createSourceEventStreamImpl(
    exeContext: ExecutionContext,
  ): Promise<AsyncIterable<unknown> | ExecutionResult>;
  executeSubscriptionRootField(exeContext: ExecutionContext): Promise<unknown>;
  executeSubscriptionEvent(
    exeContext: ExecutionContext,
  ): PromiseOrValue<
    ExecutionResult | AsyncGenerator<AsyncExecutionResult, void, void>
  >;
  addPatches(
    exeContext: ExecutionContext,
    patches: Array<PatchFields>,
    parentType: GraphQLObjectType,
    source: unknown,
    path: Path | undefined,
    parentPayloadContext: PayloadContext,
  ): void;
  addIteratorValue(
    initialIndex: number,
    iterator: Iterator<unknown>,
    exeContext: ExecutionContext,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    itemType: GraphQLOutputType,
    path: Path,
    label: string | undefined,
    parentPayloadContext: PayloadContext,
  ): void;
  addAsyncIteratorValue(
    initialIndex: number,
    iterator: AsyncIterator<unknown>,
    exeContext: ExecutionContext,
    fieldNodes: ReadonlyArray<FieldNode>,
    info: GraphQLResolveInfo,
    itemType: GraphQLOutputType,
    path: Path,
    label: string | undefined,
    parentPayloadContext: PayloadContext,
  ): Promise<void>;
  advanceAsyncIterator(
    index: number,
    iterator: AsyncIterator<unknown>,
    exeContext: ExecutionContext,
    fieldNodes: ReadonlyArray<FieldNode>,
    itemType: GraphQLOutputType,
    path: Path,
    payloadContext: PayloadContext,
    prevPayloadContext: PayloadContext,
  ): Promise<IteratorResult<unknown> | undefined>;
  closeAsyncIterator(
    exeContext: ExecutionContext,
    iterator: AsyncIterator<unknown>,
  ): void;
  hasNext(exeContext: ExecutionContext): boolean;
  queue(
    exeContext: ExecutionContext,
    payloadContext: PayloadContext,
    parentPayloadContext: PayloadContext,
    data: ObjMap<unknown> | unknown | null,
    path: Path | undefined,
  ): void;
  pushResult(
    exeContext: ExecutionContext,
    push: Push<ExecutionPatchResult>,
    stop: Stop,
    payloadContext: PayloadContext,
    data: ObjMap<unknown> | unknown | null,
    path: Path | undefined,
  ): void;
  pushResults(
    exeContext: ExecutionContext,
    push: Push<ExecutionPatchResult>,
    stop: Stop,
    results: Array<IncrementalResult>,
  ): void;
  createPatchResult(
    exeContext: ExecutionContext,
    data: ObjMap<unknown> | unknown | null,
    errors: ReadonlyArray<GraphQLError>,
    path: Path | undefined,
    label?: string,
  ): ExecutionPatchResult;
}
/**
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function while passing along args and context value.
 */
export declare const defaultFieldResolver: GraphQLFieldResolver<
  unknown,
  unknown
>;
/**
 * If a resolveType function is not given, then a default resolve behavior is
 * used which attempts two strategies:
 *
 * First, See if the provided value has a `__typename` field defined, if so, use
 * that value as name of the resolved type.
 *
 * Otherwise, test each possible type for the abstract type by calling
 * isTypeOf for the object being coerced, returning the first type that matches.
 */
export declare const defaultTypeResolver: GraphQLTypeResolver<unknown, unknown>;
export {};
