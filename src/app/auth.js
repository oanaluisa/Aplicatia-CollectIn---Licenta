module.exports = {
    sessionChecker: (req, res, next) => {
        if (req.session.user_id && req.cookies.user_sid) {
            next();
        } else {
            res.redirect('/');
        }
    },
    sessionCheckerInverse: (req, res, next) => {
        if (req.session.user_id && req.cookies.user_sid) {
            res.redirect('/dashboard');
        } else {
            next();
        }
    }
};