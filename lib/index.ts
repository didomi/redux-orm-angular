import { QuerySet, QuerySetSelector } from './queryset';
import { ORM, Model } from 'redux-orm';

/**
 * Select data from redux-orm
 * 
 * This call replicates the API from redux-orm so the query syntax is the same.
 * Only "read" functions are available: all, get, hasId, withId
 */
class ORMSelector {
    /**
     * The name of the model that we are querying
     */
    modelName: string;

    /**
     * The name of the slice in the Redux store that holds the ORM data
     */
    stateSliceKey: string;

    /**
     * @param string modelName The name of the model to query
     * @param string stateSliceKey The name of the slice in the Redux store that holds the ORM data
     */
    constructor(model: Object | string, stateSliceKey = 'data') {
        if (typeof model === 'function' && model['modelName']) {
            this.modelName = model['modelName'];
        } else if(typeof model === 'string') {
            this.modelName = model;
        } else {
            throw new Error('A valid model name (string) or model (object) must be provided to selectData');
        }

        this.stateSliceKey = stateSliceKey;
    }

    /**
     * Build a selector that queries the ORM
     * See the `all` function from http://tommikaikkonen.github.io/redux-orm/Model.html
     * 
     * @return QuerySetSelector A function that gets all model instances from the state and allows further filtering
     */
    all(): QuerySetSelector {
        return QuerySet(this.getModelFromState.bind(this));
    }

    /**
     * Build a selector that gets a model instance that matches properties in the `query` object
     * See the `get` function from http://tommikaikkonen.github.io/redux-orm/Model.html
     * 
     * If there is no instance matching the properties, `null` will be returned and no exception will be thrown (contrary to the behavior of redux-orm). This helps dealing with these cases in Angular.
     * Warning: if there are multiple instances matching the properties, we will throw an error just like redux-orm does.
     * 
     * @param object query The properties used to match a model instance
     * 
     * @return function A function that gets a model instance from the state
     */
    get(query): (state: any) => Model {
        return (state) => {
            try {
                return this.getModelFromState(state).get(query);
            } catch(error) {
                if (error.message === 'Model instance not found when calling get method') {
                    // No instance matches the query
                    // Simply return null
                    return null;
                }
                
                // Unhandled error, re-throw
                throw error;
            }           
        }
    }

    /**
     * Build a selector that checks if a model instance with a given `id` exists in the store
     * See the `hasId` function from http://tommikaikkonen.github.io/redux-orm/Model.html
     * 
     * @param string id The id to look for
     * 
     * @return function A function that returns a boolean indicating if an entity with the id `id` exists in the state
     */
    hasId(id): (state: any) => boolean {
        return (state) => {
            return this.getModelFromState(state).hasId(id);
        }
    }

    /**
     * Build a selector that gets a model instance with the specified `id`
     * See the `withId` function from http://tommikaikkonen.github.io/redux-orm/Model.html
     * 
     * If there is no instance with that id, `null` will be returned and no exception will be thrown (contrary to the behavior of redux-orm). This helps dealing with these cases in Angular.
     * Warning: if there are multiple instances matching the properties, we will throw an error just like redux-orm does.
     * 
     * @param string id The `id` used to match a model instance
     * 
     * @return function A function that gets a model instance from the state
     */
    withId(id): (state: any) => Model {
        return (state) => {
            try {
                return this.getModelFromState(state).withId(id);
            } catch(error) {
                if (error.message.indexOf(`instance with id ${id} not found`) !== -1) {
                    // No instance matches the query
                    // Simply return null
                    return null;
                }
                
                // Unhandled error, re-throw
                throw error;
            }  
        }
    }

    /**
     * Get a model from a session populated from the current state
     * 
     * @param Object state The current state
     * 
     * @return Object A session model
     */
    getModelFromState(state) {
        // We use a global shared ORM instance that is expected to be set for the project during setup
        // This is not ideal but that's how angular-redux does it as well because we could be in a decorator
        // and do not have access to the Angular objects (components, services, etc.)
        if (!ORM.instance) {
            return [];
        }

        // Get the slice of the state that holds the ORM data
        const stateSlice = state[this.stateSliceKey];

        // Create a session from the ORM instance
        const session = ORM.instance.session(stateSlice || ORM.instance.emptyDBState);
        const model = session[this.modelName];

        return model;
    }
}

/**
 * Select data from redux-orm
 * 
 * A helper function that can be used with angular-redux in the @select decorator or when calling
 * ngRedux.select (https://github.com/angular-redux/store/blob/master/articles/select-pattern.md) to select
 * models from redux-orm.
 * 
 * The function replicates the API from redux-orm so the query syntax is the same.
 * Only "read" functions (withId, all) are available.
 * 
 * @param {Object | string} model The name of the Model or the Model object that we are querying
 * @param string stateSliceKey The name of the slice that holds the ORM data in the state
 */
export function selectData(model: Object | string, stateSliceKey = 'data') {
    return new ORMSelector(model, stateSliceKey);
}