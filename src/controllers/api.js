const fs = require('fs');
const express = require('express');
const router = express.Router({});
const moment = require('moment');
const multer  = require('multer');
const uuidv1 = require('uuid/v1');
const response = require('../app/api_response');
const utils = require('../app/utils');
const models = require('../models/models');


// Multer upload object

let upload_photo = multer({storage: multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './media/');
    },
    filename: function (req, file, cb) {
        // cb(null, 'photos/' + file.originalname);
        let folder = 'photos/' + moment().format('YYYY-MM');
        if (!fs.existsSync('media/' + folder)) {
            fs.mkdirSync('media/' + folder);
        }
        cb(null, folder + '/' + uuidv1() + '.jpeg');
    }
})});


router.post('/albums/add', function(req, res){
    let nad = new models.Album({
        name: req.body.name,
        uri: utils.slugify(req.body.name),
        location: req.body.location,
        date_from: moment(req.body.date_from),
        added_by_id: req.session.user_id,
        added_on: moment()
    });

    if (req.body.public) nad.public = true;

    nad.members.push({
        user_id: req.session.user_id,
        rank: 0,
        added_on: moment()
    });

    nad.save().then(x => {
        console.log('[controllers.models] Added:', x);
        response.ok(res, x);
    });
});

router.post('/albums/add-photo/:aid', upload_photo.single('file'), function(req, res) {
    console.log('UPLOAD', req.file.filename);

    let aid = req.params.aid;
    models.Album.findById(aid, function(e, album) {
        album.photos.push({photo: req.file.filename, added_on: moment()});
        album.save().then(x => {
            response.ok(res, req.file.filename);
        });
    });
});

router.post('/albums/add-member', function(req, res) {
    let aid = req.body.aid;
    let memberEmail = req.body.member_email;

    models.Album.findById(aid, function(e, album) {
        models.User.findOne({email: memberEmail}, function(e, owner) {
            if (owner) {
                album.members.push({user_id: owner._id, rank: 1, added_on: moment()});
                album.save().then(x => {
                    response.ok(res, album);
                });
            } else {
                response.error(res, 'Acest utilizator nu exista');
            }
        });
    });
});

router.post('/albums/set-cover', function(req, res) {
    let photoId = req.body.photo_id;
    let albumId = req.body.album_id;

    models.Album.findById(albumId, function(e, album) {
        let foundCover = album.photos.id(photoId);
        album.cover = foundCover;
        album.save().then(x => {
            console.log('[controllers.models] Album set cover. Album updated:', x);
            response.ok(res, x);
        });
    });
});

router.post('/albums/delete-album', function(req, res) {
    models.Album.findById(req.body.album_id, function(e, album) {
        album.remove().then(x => {
            console.log('[controllers.models] Deleted:', x);
            response.ok(res, x);
        });
    });
});

router.post('/albums/delete-album-member', function(req, res) {
    models.Album.findById(req.body.album_id, function(e, album) {
        let member_id = req.body.member_id;
        for(let i=0; i<album.members.length; i++) {
            if (album.members[i].user_id.toString() === member_id) {
                let albumMemberObj = album.members.id(album.members[i]._id);
                albumMemberObj.remove();

                album.save().then(x => {
                    console.log('[controllers.models] Album member deleted:', x);
                    response.ok(res, x);
                });
            }
        }
    });
});

router.post('/albums/leave-album', function(req, res) {
    models.Album.findById(req.body.album_id, function(e, album) {
        for(let i=0; i<album.members.length; i++) {
            if (album.members[i].user_id.toString() === req.session.user_id) {
                let albumMemberObj = album.members.id(album.members[i]._id);
                albumMemberObj.remove();

                album.save().then(x => {
                    console.log('[controllers.models] Album left:', x);
                    response.ok(res, x);
                });
            }
        }
    });
});

router.post('/albums/join-album', function(req, res) {
    models.Album.findById(req.body.album_id, function(e, album) {
        album.members.push({user_id: req.session.user_id, rank: 1, added_on: moment()});
        album.save().then(x => {
            response.ok(res, album);
        });
    });
});

router.post('/albums/edit', function(req, res){
    models.Album.findById(req.body.id, function (e, album) {
        if (req.body.name) {
            album.name = req.body.name;
            album.uri = utils.slugify(req.body.name);
        }
        if (req.body.location) album.location = req.body.location;
        if (req.body.date_from) album.date_from = moment(req.body.date_from);

        album.save().then(x => {
            console.log('[controllers.models] Edited:', req.body.name);
            response.ok(res, x);
        });
    });
});


router.post('/photos/delete-photo', function(req, res) {
    let photoId = req.body.photo_id;
    let albumId = req.body.album_id;

    models.Album.findById(albumId, function(e, album) {
        let foundPhoto = album.photos.id(photoId);
        foundPhoto.remove();

        album.save().then(x => {
            console.log('[controllers.models] Deleted photo. Album updated:', x);
            response.ok(res, x);
        });
    });
});


router.post('/users/edit', function(req, res){
    models.User.findById(req.body.id, function(e, user) {
        if (req.body.name) user.name = req.body.name;
        if (req.body.location) user.location = req.body.location;
        if (req.body.email) user.email = req.body.email;

        user.save().then(x => {
            console.log('[controllers.models] Edited:', x);
            res.clearCookie('user_sid');
            response.ok(res, x);
        });
    });
});

router.post('/users/change-password', function(req, res) {
    let id = req.body.id;
    let currentPassword = req.body.current_password;
    let newPassword = req.body.new_password;
    let newPasswordConfirm = req.body.new_password_confirm;

    models.User.findById(id, function(e, user) {
        if (currentPassword !== user.password) {
            response.error(res, 'Parola curenta nu este valida');
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            response.error(res, 'Parolele nu coincid');
            return;
        }

        user.password = newPassword;

        user.save().then(x => {
            console.log('[controllers.models] Edited:', x);
            res.clearCookie('user_sid');
            response.ok(res, x);
        });
    });
});

router.post('/users/delete-account', function(req, res) {
    models.User.findById(req.session.user_id, function(e, user) {
        res.clearCookie('user_sid');
        user.remove();
        response.ok(res, 'Done');
    });
});


module.exports = router;