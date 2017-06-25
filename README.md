# redux-orm-angular
[![Build Status](https://travis-ci.org/didomi/redux-orm-angular.svg?branch=master)](https://travis-ci.org/didomi/redux-orm-angular)
[![Coverage Status](https://coveralls.io/repos/github/didomi/redux-orm-angular/badge.svg?branch=master)](https://coveralls.io/github/didomi/redux-orm-angular?branch=master)

Helpers for integrating [angular-redux](https://github.com/angular-redux/store) and [redux-orm](https://github.com/tommikaikkonen/redux-orm).

[angular-redux](https://github.com/angular-redux/store) provides bindings for using Redux with Angular 2+ applications. [redux-orm](https://github.com/tommikaikkonen/redux-orm) is a simple ORM to manage entities in the Redux store.

This package enables querying entities from [redux-orm](https://github.com/tommikaikkonen/redux-orm) directly from Angular components. 
You can subscribe to an observable on any query supported by [redux-orm](https://github.com/tommikaikkonen/redux-orm) and do things like:

```javascript
import { selectData } from 'redux-orm-angular';

@Component(...)
export class MyNgComponent {
    @select(selectData(MyItem).all().filter(item => item.price > 10).orderBy('price')) items: Observable<Array<MyItem>>;
}
```

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
    - [Setup redux-orm and ORM.instance](#setup-redux-orm-and-orm-instance)
    - [Import selectData](#import-selectdata)
    - [Query the Redux ORM](#query-the-redux-orm)
- [Example](#example)
- [License](#license)
- [Sponsor](#sponsor)

## Installation

```
npm install --save redux-orm-angular
```

The package has peer dependencies on `redux-orm` only. Your app will require `redux` and `@angular-redux/store` to leverage this package.

## Usage

### Setup `redux-orm` and `ORM.instance`

The first step to use this package is to install and configure `redux-orm` in your project. See [redux-orm](https://github.com/tommikaikkonen/redux-orm) documentation for more information.

After initiating an `ORM` instance and registering models, you need to store that instance on the `ORM` class:

```javascript
import { ORM } from 'redux-orm';
import { MyModel } from './models';

const orm = new ORM();
orm.register(Post);

ORM.instance = orm; // Add this line to your project
```

That instance of the ORM is used by the `selectData` function to create a session and query the ORM.

**Warning:** Do not skip this step as it is required for the helper function to work correctly. An exception will be thrown if `ORM.instance` is not set correctly.

### Import `selectData`

This package exports a helper function called `selectData` that can be given as a parameter to [`angular-redux` `@select` decorator or `select` function](https://github.com/angular-redux/store/blob/master/articles/select-pattern.md).

Import this function in the components that need it:

```javascript
import { selectData } from 'redux-orm-angular';
```

**Note:** There is nothing to import or register in your NgModule and the function will be used as is.

### Query the Redux ORM

The `@select` decorator (and the `select` function) from `angular-redux` allow you to query the Redux store and get an observable on any property of the store. Whenever that property gets updated, the observable emits a new value and your component/view get the updated value. This is particularly powerful when used with [Angular's async pipe](https://angular.io/api/common/AsyncPipe) to keep your views up to date with the Redux state of the app.

The `selectData` function provided by this package enables the same mechanism on the Redux ORM: you can query the ORM for data, get an observable back and the observable will emit new values whenever the ORM entities get updated (by other components/reducers, by data coming back from your server, etc.).

Redux ORM queries look like:

```javascript
session.MyModel.all(); // Get all the instances of the model MyModel
session.MyModel.all().filter(item => item.price > 10).count(); // Count the number of items with price > 10
session.MyModel.get({ name: 'test' }); // Get instance with name === 'test'
session.MyModel.hasId(10); // Check if there is an instance with id === 10
```

`selectData` mimicks the syntax of `redux-orm`. You need to call the function with the model that you want to query as a parameter and you can then build your queries the same way as you would build them with `redux-orm`.
The `selectData` function must be passed to the `@select` decorator or to the `select` function from `angular-redux`. See the [documentation](https://github.com/angular-redux/store/blob/master/articles/select-pattern.md) for more information on how to use them.
The structure of calling `selectData` is the following:

```javascript
@select(selectData(MyModel).standardORMQuery...)
```

The previous queries with `@select` and `selectData` in an Angular component would be:

```javascript
@select(selectData(MyModel).all()) items: Observable<Array<MyModel>>; // Get all the instances of the model MyModel
@select(selectData(MyModel).all().filter(item => item.price > 10).count()) filteredItemsCount: Observable<number>; // Count the number of items with price > 10
@select(selectData(MyModel).get({ name: 'test' })) item: Observable<MyModel>; // Get instance with name === 'test'
@select(selectData(MyModel).hasId(10)) itemExists: Observable<boolean>; // Check if there is an instance with id === 10
}
```

**Important:** `selectData(MyModel)` has the same interface as `session.MyModel` (from `redux-orm`) for all the read functions (all, get, hasId, withId) and should be used in the same way.

`selectData(MyModel).all()` also has the same interface as `session.MyModel.all()` (from `redux-orm`) for all the read functions (at, count, exclude, exists, filter, first, last, orderBy, toModelArray, toRefArray).

Functions that transform data (upsert, delete, etc.) are not available on `selectData` as there would not be any good use for them.

## Example

Here is a complete example of an Angular component using `selectData`:

```typescript
import { select, NgRedux } from '@angular-redux/store';
import { selectData } from 'redux-orm-angular';
import { Observable } from 'rxjs/Observable';
import { MyItem } from './item'; // A redux-orm model

@Component({
  selector: 'app',
  template: `
Total number of items: {{ totalNumberOfItems | async }}
<ul>
  <li *ngFor="let item of (items | async)">
    {{ item.id }}
  </li>
</ul>
`
})
export class MyNgComponent {
    @select(selectData(MyItem).all().filter(item => item.price > 10).orderBy('price')) items: Observable<Array<MyItem>>;

    totalNumberOfItems: Observable<number>;

    constructor(private ngRedux: NgRedux<any>) {}

    ngOnInit() {
        this.totalNumberOfitems = this.ngRedux.select(selectData(MyItem).all().count());
    }
}
```

## License

MIT. See [LICENSE](LICENSE).

## Sponsor

<a href="https://www.didomi.io">
    <img src="https://www.didomi.io/wp-content/uploads/2017/01/cropped-didomi-horizontal-1.png" alt="Logo of Didomi" width="200" />
</a>

`redux-orm-angular` is developed and maintained by [Didomi](https://www.didomi.io), an end-to-end solution for managing data privacy and user consent.