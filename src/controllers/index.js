const express = require('express');
const router = express.Router({});
const moment = require('moment');
const auth = require('../app/auth');
const response = require('../app/api_response');
const models = require('../models/models');


router.get('/', auth.sessionCheckerInverse, function(req, res){
    res.render('index.html');
});

router.route('/register')
    .get(auth.sessionCheckerInverse, (req, res) => {
        res.render('register.html');
    })
    .post((req, res) => {
        let nu = new models.User({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            location: req.body.location
        });
        nu.save().then((x) => {
            response.ok(res, true);
        }).catch(e => {
            response.error(res, e);
        });
    });

router.route('/login')
    .get(auth.sessionCheckerInverse, (req, res) => {
        res.render('index.html');
    })
    .post((req, res) => {
        let q = models.User.findOne({'email': req.body.email, 'password': req.body.password}, function(e, u) {
            if (u !== null) {
                req.session.user_id = u.id;
                req.session.user = u;
                response.ok(res, true);
            } else {
                response.error(res, 'Email sau parola incorecte');
            }
        });
    });


router.post('/logout', (req, res) => {
    res.clearCookie('user_sid');
    response.ok(res, true);
});


module.exports = router;