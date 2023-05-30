function Message($form, type, message) {
    var alertClass = 'alert';
    if (type === "success") alertClass += ' alert-success';
    else if (type === "error") alertClass += ' alert-danger';

    $form.find('#message').remove();

    var $newElement = $('<div>').attr('id', 'message');
    $('<div>').addClass(alertClass).html(message).appendTo($newElement);
    $form.append($newElement);
}

function CallPost(url, data, successCallback, errorCallback) {
    axios.post(url, data).then(function(response) {
        // response = {status: "..", data: "..", headers: ".."}
        console.info('[' + response.status + '] POST ' + url, response);
        if (response.status === 200) {
            if (successCallback) successCallback(response.data);
        } else {
            console.error('Error:', response.status, response.data.data);
            if (errorCallback) errorCallback(response.data.data);
        }
    }).catch(function (error) {
        // error.response = {status: "..", data: "..", headers: ".."}
        var response = error.response;
        console.error('Error:', response.status, response.data.data);
        if (errorCallback) errorCallback(response.data.data);
    });
}

var Forms = {
    init: function(formId) {
        var $form = $('#' + formId);
        var $btnSubmit = $form.find('#btnSubmit');
        console.log('Initializare formular: ', $form);

        function btnDisable() {
            $btnSubmit.addClass('disabled');
        }

        function btnEnable() {
            $btnSubmit.removeClass('disabled');
        }

        var settings = {
            registerForm: {
                submit: function () {
                    CallPost('/register', $form.serialize(), function(data) {
                        var loginData = {email: $form.find('#email').val(), password: $form.find('#password').val()};
                        Actions.login(loginData, function() {
                            window.location = '/';
                        });
                    }, function(error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            loginForm: {
                submit: function () {
                    Actions.login($form.serialize(), function () {
                        window.location.href = '/';
                    }, function (error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            createForm: {
                submit: function () {
                    CallPost('/api/albums/add', $form.serialize(), function (data) {
                        window.location = '/dashboard/album/' + data.data.uri;
                    }, function (error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            albumAddPhotosForm: {
                init: function () {
                    Dropzone.autoDiscover = false;
                    new Dropzone('#drop-photos', {
                        url: "/api/albums/add-photo/" + $form.find('#inputHidAlbumId').val(),
                        accept: function(file, done) {
                            if (file.type === 'image/jpeg' || file.type === 'image/png') done();
                            else done("Fisierul trebuie sa fie de tip imagine");
                        }
                    });
                },
                submit: function() {
                    window.location = '/dashboard';
                }
            },
            albumInviteMemberForm: {
                submit: function() {
                    CallPost('/api/albums/add-member', $form.serialize(), function (data) {
                        window.location = '/dashboard/album/' + data.data.uri;
                    }, function (error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            editAlbumForm: {
                submit: function () {
                    CallPost('/api/albums/edit', $form.serialize(), function (data) {
                        window.location = '/dashboard/album/' + data.data.uri;
                    }, function(error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            settingsProfileForm: {
                submit: function () {
                    CallPost('/api/users/edit', $form.serialize(), function (data) {
                        window.location = '/';
                    }, function (error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
            settingsPasswordForm: {
                submit: function () {
                    CallPost('/api/users/change-password', $form.serialize(), function (data) {
                        window.location = '/';
                    }, function (error) {
                        Message($form, 'error', error);
                        btnEnable();
                    });
                }
            },
        };

        if (formId in settings) {
            // Initialize
            var formSettings = settings[formId];
            if ('init' in formSettings) formSettings.init();

            // Submit
            $form.submit(function(e) {
                e.preventDefault();
                if ($btnSubmit.hasClass('disabled')) return;
                btnDisable();
                if ('submit' in formSettings) formSettings.submit();
            });
        }
    }
};

var Actions = {
    login: function(loginData, successCallback, errorCallback) {
        console.log('Logging user');
        CallPost('/login', loginData, function(data) {
            if (successCallback) successCallback(data);
        }, function(errData) {
            if (errorCallback) errorCallback(errData);
        });
    },
    logout: function() {
        CallPost('/logout', '', function(response) {
            window.location.href = '/';
        }, function(error) {
            console.error(error);
        });
    },
    deleteAccount: function() {
        CallPost('/api/users/delete-account', '', function(response) {
            window.location.href = '/';
        }, function(error) {
            console.error(error);
        });
    },
    deletePhoto: function(albumId, photoId) {
        CallPost('/api/photos/delete-photo', 'album_id='+albumId+'&photo_id='+photoId, function(response) {
            alert('Fotografia a fost ștearsă definitiv.');
            window.location.reload();
        }, function(error) {
            console.error(error);
        });
    },
    deleteAlbum: function(albumId) {
        CallPost('/api/albums/delete-album', 'album_id='+albumId, function(response) {
            alert('Evenimentul a fost șters.');
            window.location.href = '/dashboard';
        }, function(error) {
            console.error(error);
        });
    },
    deleteAlbumMember: function(albumId, memberId) {
        CallPost('/api/albums/delete-album-member', 'album_id='+albumId+'&member_id='+memberId, function(response) {
            alert('Membrul a fost șters.');
            window.location.reload();
        }, function(error) {
            console.error(error);
        });
    },
    leaveAlbum: function(albumId) {
        CallPost('/api/albums/leave-album', 'album_id='+albumId, function(response) {
            alert('Ați părăsit acest eveniment.');
            window.location.href = '/dashboard';
        }, function(error) {
            console.error(error);
        });
    },
    joinAlbum: function(albumId) {
        CallPost('/api/albums/join-album', 'album_id='+albumId, function(response) {
            alert('V-ați alăturat acestui eveniment.');
            window.location.reload();
        }, function(error) {
            console.error(error);
        });
    },
    albumSetCover: function(albumId, photoId) {
        CallPost('/api/albums/set-cover', 'album_id='+albumId+'&photo_id='+photoId, function(response) {
            alert('Fotografia de copertă a fost setată pentru acest eveniment.');
            window.location.reload();
        }, function(error) {
            console.error(error);
        });
    }
};