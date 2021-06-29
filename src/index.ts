/** Execute GraphQL queries. */

export { Executor, execute, executeSync } from './execution/index';

export type {
  ExecutorArgs,
  ExecutionArgs,
  ExecutionContext,
  ExecutionResult,
  FormattedExecutionResult,
} from './execution/index';
