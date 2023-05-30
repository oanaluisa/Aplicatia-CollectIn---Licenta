const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/collectin', { autoIndex: false });

const User = mongoose.model('user', {
    email: String,
    password: String,
    name: String,
    location: String
});

let photoSchema = new mongoose.Schema({photo: String, added_on: Date});

let memberSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    rank: Number,
    added_on: {type: Date, default: Date.now()}
});

const Album = mongoose.model('album', {
    name: String,
    uri: String,
    location: String,
    date_from: Date,
    added_on: {type: Date, default: Date.now()},
    public: {type: Boolean, default: false},
    photos: [photoSchema],
    cover: photoSchema,
    added_by_id: mongoose.Schema.Types.ObjectId,
    members: [memberSchema]
});


module.exports = {User: User, Album: Album};