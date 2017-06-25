import { expect } from 'chai';
import 'mocha';
import { selectData } from '../index';
import { Post } from './helpers/models';
import { ORM } from 'redux-orm';

const testPosts = [];
for (let i = 0; i < 10; i += 1) {
    testPosts.push({
        id: i,
        title: `Post ${i}`,
    });
}

describe('ORMSelector', function () {
    beforeEach(function () {
        // Setup Redux ORM
        this.orm = new ORM();
        this.orm.register(Post);

        ORM.instance = this.orm;
        this.session = this.orm.session(); // Initialize a session with an empty state

        // Add some test posts to the ORM
        testPosts.forEach(post => this.session.Post.upsert(post));
    });

    it('should fail when an invalid model is given', function () {
        expect(() => selectData(12)).to.throw('A valid model name (string) or model (object) must be provided to selectData');
    });

    it('should return all entities', function () {
        const selector = selectData(Post).all().toRefArray();
        expect(selector(this.session.state)).to.deep.equal(testPosts);
    });

    it('should count all entities', function () {
        const selector = selectData(Post).all().count();
        expect(selector(this.session.state)).to.equal(testPosts.length);
    });

    it('should allow getting one entity', function () {
        const selectorEntityPresent = selectData(Post).get({ id: testPosts[0].id });
        expect(selectorEntityPresent(this.session.state).ref).to.deep.equal(testPosts[0]);

        const selectorEntityNotPresent = selectData(Post).get({ id: 1234 });
        expect(selectorEntityNotPresent(this.session.state)).to.equal(null);
    });

    it('should check if an entity with a given ID is present', function () {
        const selectorEntityPresent = selectData(Post).hasId(testPosts[0].id);
        expect(selectorEntityPresent(this.session.state)).to.be.true;
        
        const selectorEntityNotPresent = selectData(Post).hasId(1234);
        expect(selectorEntityNotPresent(this.session.state)).to.be.false;
    });

    it('should return one entity', function () {
        const selectorEntityPresent = selectData(Post).withId(testPosts[0].id);
        expect(selectorEntityPresent(this.session.state).ref).to.deep.equal(testPosts[0]);
        
        const selectorEntityNotPresent = selectData(Post).withId(1234);
        expect(selectorEntityNotPresent(this.session.state)).to.be.null;
    });
});