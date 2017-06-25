import { ORM, Model } from 'redux-orm';

/**
 * A hybrid type that describes a query to the ORM and a selector that can be fed to angular-redux
 */
export type QuerySetSelector = {
    (state: any): Array<Model> | Model | number | boolean,
    at(index: number): QuerySetSelector,
    count(): QuerySetSelector,
    exclude(lookupObj: Object): QuerySetSelector,
    exists(): QuerySetSelector,
    filter(lookupObj: Object): QuerySetSelector,
    first(): QuerySetSelector,
    last(): QuerySetSelector,
    orderBy: QuerySetSelector,
    toModelArray(): QuerySetSelector,
    toRefArray(): QuerySetSelector,
    filter: QuerySetSelector
};

/**
 * List of functions from redux-orm/QuerySet that we are automatically wrapping.
 * We wrap these functions to allow developers to chain them after their calls to model.all()
 */
const wrappedFunctions = [
    {
        name: 'at',
        type: 'evaluator',
    },
    {
        name: 'count',
        type: 'evaluator',
    },
    {
        name: 'exclude',
        type: 'clause',
    },
    {
        name: 'exists',
        type: 'evaluator',
    },
    {
        name: 'filter',
        type: 'clause',
    },
    {
        name: 'first',
        type: 'evaluator',
    },
    {
        name: 'last',
        type: 'evaluator',
    },
    {
        name: 'orderBy',
        type: 'clause',
    },
    {
        name: 'toModelArray',
        type: 'evaluator',
    },
    {
        name: 'toRefArray',
        type: 'evaluator',
    },
];

/**
 * Queries to the database
 * 
 * @param function getModelFromState A function that provides a model from the state
 * 
 * @return QuerySetSelector Returns an instance of QuerySetSelector that can be used to further specify the query to execute
 */
export function QuerySet(getModelFromState): QuerySetSelector {
    // List of functions to be called on the actual QuerySet when running the selector
    // We keep pushing onto this list as functions are called on the QuerySetSelector
    const clausesChain = [];

    // The evaluator that will be run at the end of the querying/filtering
    // This launches the evaluation of the query by redux-orm and there can be only one so it is separate from the chain of "clauses"
    let evaluator = {
        fn: { name: 'toModelArray', type: 'evaluator' },
        args: null
    };

    /**
     * The actual selector that will get called by angular-redux when watching changes
     * 
     * @param Object state The current Redux state
     * 
     * @return Array<Model> List of models returned by the query to redux-orm
     */    
    const selector = <QuerySetSelector> function (state) {
        // Create a QuerySet from redux-orm
        let querySet = getModelFromState(state).all();

        // Replay the chain of calls to make sure we rebuild the whole QuerySet
        clausesChain.forEach(call => {
            const { fn, args } = call;

            querySet = querySet[fn.name].apply(querySet, args);
        });
        
        return querySet[evaluator.fn.name].apply(querySet, evaluator.args);
    }

    // Create a function on the selector for each wrapped function defined in wrappedFunctions
    wrappedFunctions.forEach(fn => {
        selector[fn.name] = function() {
            if (fn.type === 'clause') {
                // The function is a "clause" (like a filter or an order by)
                // We push it onto the chain of calls and we return the selector so that the caller can keep chaining
                clausesChain.push({
                    fn: fn,
                    args: arguments,
                });

                // Return the selector itself
                // This is pretty important to be able to chain the calls like:
                // selector.filter(...).orderBy(...)
                return selector;
            } else if (fn.type === 'evaluator') {
                // The function is an "evaluator" (like `at` or `count`) that launches the evaluation of the query by redux-orm
                // We set it as the evaluator (there can be only one).
                evaluator = {
                    fn: fn,
                    args: arguments,
                };

                return selector;
            } else {
                throw new Error(`Unknown function type "${fn.type}"`);
            } 
        }
    });

    return selector;
}