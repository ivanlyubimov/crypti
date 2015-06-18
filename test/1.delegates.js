/**
 * Ask Sebastian if you have any questions. Last Edit: 31/05/2015
 */

'use strict';

// Requires and node configuration
var node = require('./variables.js');

// Account info for a RANDOM account (which we create later) - 0 XCR amount | Will act as delegate
var Raccount = node.randomAccount();

var test = 0;

// Print data to console
console.log("Starting delegates-test suite");
console.log("Password for random account is: " + Raccount.password);
console.log("Random XCR is: " + (node.XCR / node.normalizer));
console.log("Random delegate name is: " + Raccount.name);

// Starting tests //

describe('Delegates', function() {

    describe('Vote and Register delegate attempts from account with 0 XCR', function() {

        before(function (done) {
            // Open Random Account
            node.api.post('/accounts/open')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("account").that.is.an('object');
                    Raccount.address = res.body.account.address;
                    Raccount.publicKey = res.body.account.publicKey;
                    Raccount.balance = res.body.account.balance;
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to upVote a delegate from the new random account. We expect error (account should have 0 XCR)',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["+" + node.Eaccount.publicKey]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        node.expect(res.body.error).to.contain("balance");
                        done();
                    });
            }, 2000);
        });

        test += 1;
        it(test + '. We attempt to downVote a delegate from the new random account. We expect error (account should have 0 XCR)',function(done){
            this.timeout(4000);
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["-" + node.Eaccount.publicKey]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        //    node.expect(res.body.error).to.contain("balance");
                        done();
                    });
            }, 2000);
        });

        test += 1;
        it(test + '. We attempt to register as delegate from random account. Since we have 0 XCR, we expect error',function(done){
            node.api.put('/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password,
                    username: Raccount.delegateName
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    node.expect(res.body.error).to.contain("balance");
                    done();
                });
        });

    });

    describe('upVoting and downVoting',function() {

        before(function(done){
            // Send random XCR amount from foundation account to Random account
            node.api.put('/transactions')
                .set('Accept', 'application/json')
                .send({
                    secret: node.Faccount.password,
                    amount: node.XCR,
                    recipientId: Raccount.address
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("transactionId");
                    node.expect(res.body.transactionId).to.be.above(1);
                    Raccount.amount += node.XCR;
                    done();
                });
        });

        before(function (done) {
            // Check that Raccount has the XCR we sent
            this.timeout(node.blockTimePlus); // Fail test if not finished in 12s
            setTimeout(function(){
                node.api.post('/accounts/open')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.true;
                        node.expect(res.body.account.balance).to.be.equal(node.XCR);
                        /*
                         node.expect(res.body).to.have.property("account").that.is.an('object');
                         node.expect(res.body.account.address).to.be.equal(Raccount.address);
                         node.expect(res.body.account.publicKey).to.be.equal(Raccount.publicKey);
                         console.log("12s passed");
                         console.log("Balance is: " + (res.body.account.balance / node.normalizer) + " XCR");
                         */
                        done();
                    });
            }, node.blockTime);
        });

        test += 1;
        it(test + '. We attempt to upVote same delegate SEVERAL TIMES from random account. We expect error',function(done){
            var votedDelegate = '"+' + node.Eaccount.publicKey + '","+' + node.Eaccount.publicKey + '"';
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: [votedDelegate]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to downVote same delegate SEVERAL TIMES from random account. We expect error',function(done){
            var votedDelegate = '"-' + node.Eaccount.publicKey + '","-' + node.Eaccount.publicKey + '"';
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: [votedDelegate]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to upVote & downVote same delegate from random account in same request. We expect error',function(done){
            var votedDelegate = '"+' + node.Eaccount.publicKey + '","-' + node.Eaccount.publicKey + '"';
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: [votedDelegate]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to upVote a delegate from the new random account. We expect success',function(done){
            node.api.put('/accounts/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password,
                    delegates: ["+" + node.Eaccount.publicKey]
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("transaction").that.is.an('object');
                    node.expect(res.body.transaction.type).to.equal(node.TxTypes.VOTE);
                    node.expect(res.body.transaction.amount).to.equal(0);
                    node.expect(res.body.transaction.senderPublicKey).to.equal(Raccount.publicKey);
                    node.expect(res.body.transaction.fee).to.equal(node.Fees.voteFee);
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to upVote same delegate from the same random account. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["+" + node.Eaccount.publicKey]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        node.expect(res.body.error).to.contain("you already voted");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to downVote a delegate from the new random account. We expect success',function(done){
            // We wait for a new block
            this.timeout(node.blockTimePlus); // Fail test if not finished in 12s
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["-" + node.Eaccount.publicKey]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.true;
                        node.expect(res.body).to.have.property("transaction").that.is.an('object');
                        node.expect(res.body.transaction.type).to.equal(node.TxTypes.VOTE);
                        node.expect(res.body.transaction.amount).to.equal(0);
                        node.expect(res.body.transaction.senderPublicKey).to.equal(Raccount.publicKey);
                        node.expect(res.body.transaction.fee).to.equal(node.Fees.voteFee);
                        done();
                    });
            }, node.blockTime);
        });

        test += 1;
        it(test + '. We attempt to downVote same delegate from the same random account. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["-" + node.Eaccount.publicKey]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        node.expect(res.body.error).to.contain("you already voted");
                        done();
                    });
            }, 2000);
        });

        test += 1;
        it(test + '. We attempt to upVote delegate from the same random account, however we do not send secret. We expect error',function(done){
            node.api.put('/accounts/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: "",
                    delegates: ["+" + node.Eaccount.publicKey]
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to downVote delegate from the same random account, however we do not send secret. We expect error',function(done){
            node.api.put('/accounts/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: "",
                    delegates: ["-" + node.Eaccount.publicKey]
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to upVote delegate from the same random account, however we do not send delegate. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
            node.api.put('/accounts/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password,
                    delegates: ["+"]
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
            }, 3000);
        });

        test += 1;
        it(test + '. We attempt to downVote delegate from the same random account, however we do not send delegate. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/accounts/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        delegates: ["-"]
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 3000);
        });

        test += 1;
        it(test + '. We attempt to vote for empty delegate list from the same random account. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
            node.api.put('/accounts/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password,
                    delegates: ""
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
            }, 3000);
        });
    });

    describe('Delegate Registration attempts',function() {

        test += 1;
        it(test + '. We attempt to register as delegate from the random account, but we DO NOT SEND SECRET. We expect error',function(done){
            node.api.put('/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret:'',
                    username: Raccount.delegateName
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to register as delegate from the random account, but we SEND INVALID SYNTAX. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret:[],
                        username: Raccount.delegateName
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 3000);
        });

        test += 1;
        it(test + '. We attempt to register as delegate from random account but we send INVALID DELEGATE NAME. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        username: "~!@#$%^&*()_+.,?/"
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to register as delegate from random account but we send LONG DELEGATE NAME. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        username: "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to register as delegate from random account but we DONT SEND DELEGATE NAME. We expect error',function(done){
            this.timeout(5000);
            setTimeout(function(){
                node.api.put('/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        username: ""
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, 1000);
        });

        test += 1;
        it(test + '. We attempt to register as delegate from random account: ' + Raccount.password + '. We expect success',function(done){
            node.api.put('/delegates')
                .set('Accept', 'application/json')
                .send({
                    secret: Raccount.password,
                    username: Raccount.delegateName
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("transaction").that.is.an('object');
                    node.expect(res.body.transaction.fee).to.equal(node.Fees.delegateRegistrationFee);
                    node.expect(res.body.transaction.asset.delegate.username).to.equal(Raccount.delegateName);
                    node.expect(res.body.transaction.asset.delegate.publicKey).to.equal(Raccount.publicKey);
                    node.expect(res.body.transaction.type).to.equal(node.TxTypes.DELEGATE);
                    node.expect(res.body.transaction.amount).to.equal(0);
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to re-register as delegate from SAME random account: ' + Raccount.password + '. We expect error',function(done){
            this.timeout(node.blockTimePlus);
            setTimeout(function(){
                node.api.put('/delegates')
                    .set('Accept', 'application/json')
                    .send({
                        secret: Raccount.password,
                        username: Raccount.delegateName
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.false;
                        node.expect(res.body).to.have.property("error");
                        done();
                    });
            }, node.blockTime);
        });
    });

    describe.skip('Get Delegates list',function() {

        test += 1;
        it(test + '. We attempt to get a list of all delegates. We expect success',function(done){
            var limit = 10;
            var offset = 0;
            node.api.get('/delegates?limit='+limit+'&offset='+offset+'&oderBy=vote:asc')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("delegates").that.is.an('array');
                    node.expect(res.body).to.have.property("totalCount").that.is.at.least(0);
                    node.expect(res.body.delegates).to.have.length.of.at.most(limit);
                    var num_of_delegates = res.body.delegates.length;
                    console.log("Limit is " + limit + ". Number of delegates returned is: " + num_of_delegates);
                    console.log("Total Number of delegates returned is: " + res.body.totalCount);
                    if (num_of_delegates >= 1) {
                        node.expect(res.body.delegates[0]).to.have.property("username");
                        node.expect(res.body.delegates[0]).to.have.property("publicKey");
                        node.expect(res.body.delegates[0]).to.have.property("vote");
                        node.expect(res.body.delegates[0]).to.have.property("rate");
                        node.expect(res.body.delegates[0]).to.have.property("productivity");
                    }
                    if (num_of_delegates >= 4){
                        node.expect(res.body.delegates[0].vote).to.be.at.least(res.body.delegates[1].vote);
                        node.expect(res.body.delegates[2].vote).to.be.at.least(res.body.delegates[3].vote);
                    }
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to get a list of all delegates. Different parameters. We expect success',function(done){
            var limit = 20;
            var offset = 10;
            node.api.get('/delegates?limit='+limit+'&offset='+offset+'&oderBy=rate:desc')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("delegates").that.is.an('array');
                    node.expect(res.body).to.have.property("totalCount").that.is.at.least(0);
                    node.expect(res.body.delegates).to.have.length.of.at.most(limit);
                    var num_of_delegates = res.body.delegates.length;
                    console.log("Limit is: " + limit + ". Number of delegates returned is: " + num_of_delegates);
                    console.log("Total Number of delegates returned is: " + res.body.totalCount);
                    if (num_of_delegates >= 1) {
                        node.expect(res.body.delegates[0]).to.have.property("username");
                        node.expect(res.body.delegates[0]).to.have.property("publicKey");
                        node.expect(res.body.delegates[0]).to.have.property("vote");
                        node.expect(res.body.delegates[0]).to.have.property("rate");
                        node.expect(res.body.delegates[0]).to.have.property("productivity");
                    }
                    if (num_of_delegates >= 4){
                        node.expect(res.body.delegates[0].rate).to.be.below(res.body.delegates[1].vote);
                        node.expect(res.body.delegates[2].rate).to.be.below(res.body.delegates[3].vote);
                    }
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to get a list of all delegates but we send invalid params. We still expect success',function(done){
            // We expect success because invalid parameters that we send are optional parameters
            var limit = 'invalid';
            var offset = 'invalid';
            node.api.get('/delegates?limit='+limit+'&offset='+offset+'&oderBy=invalid')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.true;
                    node.expect(res.body).to.have.property("delegates").that.is.an('array');
                    node.expect(res.body).to.have.property("totalCount").that.is.at.least(0);
                    node.expect(res.body.delegates).to.have.length.of(0);
                    done();
                });
        });

        test += 1;
        it(test + '. We attempt to get list of delegates voted by specific address parameter. We expect success',function(done) {
                node.api.get('/accounts/delegates?address=' + node.Faccount.address)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        console.log(res.body);
                        node.expect(res.body).to.have.property("success").to.be.true;
                        node.expect(res.body).to.have.property("delegates").that.is.an('array');
                        node.expect(res.body.delegates).to.have.length.of.at.least(1);
                        node.expect(res.body.delegates[0]).to.have.property("username");
                        node.expect(res.body.delegates[0]).to.have.property("address");
                        node.expect(res.body.delegates[0]).to.have.property("publicKey");
                        node.expect(res.body.delegates[0]).to.have.property("vote");
                        node.expect(res.body.delegates[0]).to.have.property("rate");
                        node.expect(res.body.delegates[0]).to.have.property("productivity");
                        done();
                    });
            });

        test += 1;
        it(test + '. We attempt to get delegate via address parameter but we send INVALID ADDRESS. We expect error',function(done){
            node.api.get('/accounts/delegates?address=NOTaCryptiAddress')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    console.log(res.body);
                    node.expect(res.body).to.have.property("success").to.be.false;
                    node.expect(res.body).to.have.property("error");
                    done();
                });
        });
    });

    console.log("Finished delegates-test suite");
});