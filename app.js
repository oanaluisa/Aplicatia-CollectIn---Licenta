const express = require('express');
const nunjucks = require('nunjucks');
const moment = require('moment');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/media', express.static('media'));
app.use('/public', express.static('public'));

let env = nunjucks.configure('src/views', {autoescape: true, express: app, noCache: true});
env.addFilter('date', function(str) {
    return moment(str).format('YYYY-MM-DD');
});

// Initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// Initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    store: new FileStore(),
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use('/api', require('./src/controllers/api'));
app.use('/dashboard', require('./src/controllers/dashboard'));
app.use('/', require('./src/controllers/index'));

let server = app.listen(3000, function () {
    let port = server.address().port;
    console.log('[app] collectIn Started. Listening on', port);
});