const express = require('express');
const mongoose = require('mongoose');
const router = express.Router({});
const moment = require('moment');
const auth = require('../app/auth');
const utils = require('../app/utils');
const models = require('../models/models');


router.get('/', auth.sessionChecker, (req, res) => {
    models.Album.find({members: {$elemMatch: {user_id: req.session.user_id}}}, (e, albums) => {
        res.render('dashboard.html', {user: req.session.user, albums: albums});
    });
});

router.get('/create', auth.sessionChecker, (req, res) => {
    res.render('create.html', {user: req.session.user});
});

router.get('/album/:album_uri', auth.sessionChecker, (req, res) => {
    models.Album.findOne({uri: req.params.album_uri}, (e, album) => {
        // Get current user's membership in this album
        let member = null;
        for(let i=0; i<album.members.length; i++) {
            if (album.members[i].user_id.toString() === req.session.user_id) member = album.members[i];
        }

        // Get all users which are members in this album
        let membersIds = [];
        album.members.map(m => {
            membersIds.push(m.user_id.toString())
        });
        models.User.find({'_id': {$in: membersIds}}, (e, members) => {
            res.render('album.html', {user: req.session.user, album: album, members: members, member: member});
        });
    });
});

router.get('/album/:album_uri/add-photos', auth.sessionChecker, (req, res) => {
    models.Album.findOne({uri: req.params.album_uri}, (e, album) => {
        res.render('album.add.photos.html', {user: req.session.user, album: album});
    });
});

router.get('/album/:album_uri/edit', auth.sessionChecker, (req, res)=> {
    models.Album.findOne({uri: req.params.album_uri}, (e,album) => {
        res.render('edit.html', {user: req.session.user, album: album});
    });
});

router.get('/user/:user_id', auth.sessionChecker, (req, res) => {
    let owner_id = req.params.user_id;
    models.User.findById(owner_id, (e, owner) => {
        models.Album.find({members: {$elemMatch: {user_id: owner_id}}}, (e, albums) => {
            res.render('user.html', {user: req.session.user, owner: owner, albums: albums});
        });
    });
});

router.get('/explore', auth.sessionChecker, (req, res) => {
    models.Album.find({public: true}, (e, albums) => {
        let locations = [];
        for(let i=0; i<albums.length; i++) {
            let toAdd = true;
            for(let j=0; j<locations.length; j++) {
                if (locations[j].slug === utils.slugify(albums[i].location)) toAdd = false;
            }
            if (toAdd) locations.push({
                name: albums[i].location,
                slug: utils.slugify(albums[i].location)
            });
        }
        res.render('explore.html', {user: req.session.user, locations: locations});
    });
});

router.get('/explore/:location', auth.sessionChecker, (req, res) => {
    let locationSlug = req.params.location;
    let location = {slug: locationSlug, name: locationSlug.replace(/-/g, ' ')};
    let retAlbums = [];

    let filterObject = {public: true};

    // Treat possible filter by name
    if (req.query.name) {
        filterObject.name = {$regex: req.query.name, $options: "i"};
    }

    models.Album.find(filterObject, (e, albums) => {
        if (albums) {
            for (let i = 0; i < albums.length; i++) {
                if (utils.slugify(albums[i].location) === locationSlug) retAlbums.push(albums[i]);
            }
        }
        res.render('explore.location.html', {user: req.session.user, albums: retAlbums, search: req.query.name, location: location});
    });
});

router.get('/settings', auth.sessionChecker, (req, res) => {
    res.render('settings.html', {user: req.session.user});
});


module.exports = router;