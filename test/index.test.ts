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

        ORM.angularConfig = {
            instance: this.orm,
            stateKey: 'data'
        };
        
        this.session = this.orm.session(this.orm.emptyDBState); // Initialize a session with an empty state

        // Add some test posts to the ORM
        testPosts.forEach(post => this.session.Post.upsert(post));
    });

    it('should throw an error when an invalid model is given', function () {
        expect(() => selectData(12)).to.throw('A valid model name (string) or model (object) must be provided to selectData');
    });
    
    it('should throw an error when ORM.angularConfig is not set', function () {
        delete ORM.angularConfig;

        const selector = selectData('Post').hasId(0);
        expect(() => selector({ data: this.session.state })).to.throw('ORM.angularConfig should be set before using `selectData`');
    });

    it('should throw an error when ORM.angularConfig.instance is not set', function () {
        ORM.angularConfig.instance = null;

        const selector = selectData('Post').hasId(0);
        expect(() => selector({ data: this.session.state })).to.throw('Impossible to find the ORM instance to use. Make sure you have configured ORM.angularConfig.instance to the ORM instance that you want to use with `selectData`');
    });

    it('should throw an error when ORM.angularConfig.stateKey is not set', function () {
        delete ORM.angularConfig.stateKey;

        const selector = selectData('Post').hasId(0);
        expect(() => selector({ data: this.session.state })).to.throw('Impossible to find the state key from the config. Make sure you have configured ORM.angularConfig.stateKey to a non-empty value');
    });

    it('should throw an error when ORM.angularConfig.stateKey is does not point to a valid DB state', function () {
        const selector = selectData('Post').hasId(0);
        expect(() => selector({})).to.throw('Impossible to find the DB state; make sure you have configured ORM.angularConfig.stateKey and that you have a reducer running your ORM');
    });

    it('should work with model names', function () {
        const selector = selectData('Post').all().toRefArray();
        expect(selector({ data: this.session.state })).to.deep.equal(testPosts);
    });

    it('should return all entities', function () {
        const selector = selectData(Post).all().toRefArray();
        expect(selector({ data: this.session.state })).to.deep.equal(testPosts);
    });

    it('should count all entities', function () {
        const selector = selectData(Post).all().count();
        expect(selector({ data: this.session.state })).to.equal(testPosts.length);
    });

    it('should allow filtering entities', function () {
        const selector = selectData(Post).all().filter(item => item.id >= 5).toRefArray();
        expect(selector({ data: this.session.state })).to.deep.equal(testPosts.slice(5));
    });

    it('should allow getting one entity', function () {
        const selectorEntityPresent = selectData(Post).get({ id: testPosts[0].id });
        expect(selectorEntityPresent({ data: this.session.state }).ref).to.deep.equal(testPosts[0]);

        const selectorEntityNotPresent = selectData(Post).get({ id: 1234 });
        expect(selectorEntityNotPresent({ data: this.session.state })).to.equal(null);
    });

    it('should throw an error when multiple entities match a get request', function () {
        this.session.Post.upsert({
            id: 11,
            title: 'Post 0'
        });

        const selector = selectData(Post).get({ title: 'Post 0' });
        expect(() => selector({ data: this.session.state })).to.throw('Expected to find a single row in Model.get');
    });

    it('should check if an entity with a given ID is present', function () {
        const selectorEntityPresent = selectData(Post).hasId(testPosts[0].id);
        expect(selectorEntityPresent({ data: this.session.state })).to.be.true;
        
        const selectorEntityNotPresent = selectData(Post).hasId(1234);
        expect(selectorEntityNotPresent({ data: this.session.state })).to.be.false;
    });

    it('should return one entity (withId)', function () {
        const selectorEntityPresent = selectData(Post).withId(testPosts[0].id);
        expect(selectorEntityPresent({ data: this.session.state }).ref).to.deep.equal(testPosts[0]);
        
        const selectorEntityNotPresent = selectData(Post).withId(1234);
        expect(selectorEntityNotPresent({ data: this.session.state })).to.be.null;
    });
});