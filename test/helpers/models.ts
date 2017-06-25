import { attr, Model } from 'redux-orm';

export class Post extends Model {
    toString() {
        return `Post: ${this['name']}`;
    }
}

Post['modelName'] = 'Post';

Post['fields'] = {
    id: attr(),
    title: attr()
};