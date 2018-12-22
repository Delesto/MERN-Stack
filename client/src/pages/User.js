import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import classNames from 'classnames';

//Containers
import DeletePostDialog from '../containers/DeletePostDialog'
import AppDrawer from '../containers/AppDrawer';
import AppBar from '../containers/AppBar';

//Components
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Fab from '@material-ui/core/Fab';
import DeleteIcon from '@material-ui/icons/Delete';

//Utils
import isExpiredToken from '../utils/isExpiredToken';
import getItem from '../utils/getItem';

//Constants
import GET_USER_REQUEST from '../constants/GET_USER_REQUEST';
import GET_USER_SUCCESS from '../constants/GET_USER_SUCCESS';
import GET_USER_FAILURE from '../constants/GET_USER_FAILURE';
import CREATE_POST_REQUEST from '../constants/CREATE_POST_REQUEST';
import CREATE_POST_SUCCESS from '../constants/CREATE_POST_SUCCESS';
import CREATE_POST_FAILURE from '../constants/CREATE_POST_FAILURE';
import DELETE_POST_REQUEST from '../constants/DELETE_POST_REQUEST';
import DELETE_POST_SUCCESS from '../constants/DELETE_POST_SUCCESS';
import DELETE_POST_FAILURE from '../constants/DELETE_POST_FAILURE';

//Actions
import request from '../actions/request';
import setPostId from '../actions/setPostId';
import { push } from 'connected-react-router';
import openDrawer from '../actions/openDrawer';
import closeDrawer from '../actions/closeDrawer';
import refreshTokens from '../actions/refreshTokens';
import openPostDialog from '../actions/openPostDialog';
import closePostDialog from '../actions/closePostDialog';
import openDeletePostDialog from '../actions/openDeletePostDialog';
import closeDeletePostDialog from '../actions/closeDeletePostDialog';

//Styles
import { styles } from '../assets/jss/styles';

//Utils
import getLocalState from '../utils/getLocalState';

class User extends Component {
    constructor(props) {
        super(props);
        this.localState = getLocalState();
        this.state = {
            title: '',
            content: '',
        }
        this.async = this.async.bind(this);
        this.createPosts = this.createPosts.bind(this);
        this.postDialog = this.postDialog.bind(this);
        this.sendPost = this.sendPost.bind(this);
        this.deletePost = this.deletePost.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleContentChange = this.handleContentChange.bind(this);
        this.isPageOwner = this.isPageOwner.bind(this);

        this.accessToken = getItem('access-token');
        this.refreshToken = getItem('refresh-token');
    }

    componentWillMount() {
        const pathname = this.props; //Get url path
        const id = pathname.match.params.id; //Segmented url

        this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE);
    }

    // componentDidUpdate(prevProps) {
    //     const pathname = this.props;
    //     const id = pathname.match.params.id;
    //     prevProps.pages.userPage.post.create.loading && this.props.pages.userPage.post.create.data && this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE)
    // }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }
    
    handleContentChange(event) {
        this.setState({content: event.target.value});
    }

    isPageOwner() {
        if((this.localState && this.localState.auth.session.user.data._id)
           === this.props.pages.userPage.user.data._id) {
            return true;
        } else {
            return false;
        }
    }
    
    sendPost(title, content) {
        const userId = this.localState.auth.session.user.data._id;
        const pathname = this.props;
        const id = pathname.match.params.id;
        if(isExpiredToken(this.accessToken)) {
            this.props.refreshTokens(this.refreshToken, () => {
                this.props.request(`/api/user/${userId}/article`, 'post', { title, content }, null, () => {
                    this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE);
                })(CREATE_POST_REQUEST, CREATE_POST_SUCCESS, CREATE_POST_FAILURE);
            });
        } else {
            this.props.request(`/api/user/${userId}/article`, 'post', { title, content }, null, () => {
                this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE);
            })(CREATE_POST_REQUEST, CREATE_POST_SUCCESS, CREATE_POST_FAILURE);
        }
        this.props.closePostDialog();
    }
    
    deletePost() {
        const userId = this.localState.auth.session.user.data._id;
        const postId = this.props.pages.userPage.user.postId;

        const pathname = this.props;
        const id = pathname.match.params.id;
        if(isExpiredToken(this.accessToken)) {
            this.props.refreshTokens(this.refreshToken, () => {
                this.props.request(`/api/user/${userId}/article/${postId}`, 'delete', null, null, () => {
                    this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE)
                })(DELETE_POST_REQUEST, DELETE_POST_SUCCESS, DELETE_POST_FAILURE);
            });
        } else {
            this.props.request(`/api/user/${userId}/article/${postId}`, 'delete', null, null, () => {
                this.props.request(`/api/user/${id}`, 'get')(GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE);
            })(DELETE_POST_REQUEST, DELETE_POST_SUCCESS, DELETE_POST_FAILURE);
        }
        this.props.closeDeletePostDialog();
    }

    postDialog() {
        const { closePostDialog, appInterface } = this.props;
        return (
            <Dialog
            open={appInterface.isPostDialogOpen}
            onClose={closePostDialog}
            aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Создание</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Колличество символов не должно привышать 120.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="title"
                        label="Заголовок"
                        type="text"
                        fullWidth
                        onChange={this.handleTitleChange}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="content"
                        label="Содержание"
                        type="text"
                        fullWidth
                        onChange={this.handleContentChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closePostDialog} color="primary">
                        Отмена
                    </Button>
                    <Button onClick={() => {this.sendPost(this.state.title, this.state.content)}} color="primary">
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }

    createPosts(user, classes) {
        const posts = [];
        const { openDeletePostDialog, setPostId } = this.props;
        user.articles.forEach((post) => {
            posts.push(
                <div className={classNames(classes.w100, classes.flex, classes.post)} key={post._id}>
                    <Card className={classes.w100}>
                        <CardContent className={classes.cardContent}>
                            <Typography gutterBottom variant="h6">
                                {post.title}
                            </Typography>
                            <Typography variant="body1">
                                {post.content}
                            </Typography>
                        </CardContent>
                    </Card>
                    {this.isPageOwner() && <Fab color="secondary" onClick={() => {setPostId(post._id); openDeletePostDialog()}} aria-label="Edit" className={classes.fabDelete}>
                        <DeleteIcon aria-label="Delete"/>
                    </Fab>} {/* Set post ID in redux store */}
                </div>
            );
        })

        return posts
    }

    async(user, classes) {
        const { openPostDialog } = this.props;
        return (
            <div>
                <div style={{ padding: 12, marginTop: 20 }}>
                    <Grid container spacing={24} justify="center">
                        <Grid item xl={2} lg={3} md={3} sm={5} xs={12}>
                            <Card>
                                <CardMedia
                                    style={{ width: '100%', minWidth: '100%',  height: '300px' }}
                                    image={user.avatarUrl}
                                    title="Contemplative Reptile"
                                />
                                <CardContent>
                                    <div className={classNames(classes.flex, classes.alignItemsCenter)}>
                                        <Typography gutterBottom variant="subtitle2" className={classes.userName}>
                                            {`${user.name},`}
                                        </Typography>
                                        <Typography variant="body1" className={classes.userAge}>
                                            {user.age || 'Возраст не указан'}
                                        </Typography>
                                    </div>
                                    <Typography variant="body1" className={classes.userCity}>
                                        {user.city || 'Город не указан'}
                                    </Typography>
                                </CardContent>
                                <Divider light />
                                <CardContent>
                                    User friends is here
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xl={8} lg={7} md={7} sm={5} xs={12} className={classNames(classes.alignItemsCenter, classes.flex, classes.flexColumn)}>
                            {this.createPosts(user, classes)}
                            {/* Add article button */}
                            {this.isPageOwner() && <Button onClick={openPostDialog} variant="contained" color="primary" className={classes.button}>
                                Новый пост +
                            </Button>}
                        </Grid>
                    </Grid>
                </div>
            </div>
        )
    }

    render() {
        const { classes, appInterface, openDrawer, closeDrawer, pages, auth } = this.props;
        return (
            <div>
            {/* hangle all request and use laoder*/}
                {pages.userPage.user.loading && <div className={classes.loader}>
                    <CircularProgress/>
                </div>}
                
                {auth.refreshTokens.loading && <div className={classes.loader}>
                    <CircularProgress/>
                </div>}
                
                {pages.userPage.post.create.loading && <div className={classes.loader}>
                    <CircularProgress/>
                </div>}
                
                {pages.userPage.post.delete.loading && <div className={classes.loader}>
                    <CircularProgress/>
                </div>}

                <AppBar title={pages.userPage.user.data && pages.userPage.user.data.name} openDrawer={openDrawer}/>
				<AppDrawer isDrawerOpen={appInterface.isDrawerOpen} closeDrawer={closeDrawer}/>
                <DeletePostDialog deletePost={this.deletePost}/>
                {this.postDialog()}
                {pages.userPage.user.data && this.async(pages.userPage.user.data, classes)}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    appInterface: state.appInterface,
    pages: state.pages,
    auth: state.auth
});

const mapDispatchToProps = (dispatch) => ({
    request: (url, method, params, headers, callback) => {
		return (REQEST, SUCCESS, FAILURE) => {
			dispatch(request(url, method, params, headers, callback)(REQEST, SUCCESS, FAILURE))
		}
    },
    refreshTokens: (refreshToken, callback) => {
        dispatch(refreshTokens(refreshToken, callback));
    },
    openDrawer: () => {
		dispatch(openDrawer());
	},
	closeDrawer: () => {
		dispatch(closeDrawer());
    },
    openPostDialog: () => {
        dispatch(openPostDialog());
    },
    closePostDialog: () => {
        dispatch(closePostDialog());
    },
    openDeletePostDialog: () => {
        dispatch(openDeletePostDialog());
    },
    closeDeletePostDialog: () => {
        dispatch(closeDeletePostDialog());
    },
    setPostId: (id) => {
        dispatch(setPostId(id));
    },
    redirectTo404: (id) => {
        dispatch(push(`/${id}`));
    }
});

User = withStyles(styles)(User);
export default connect(mapStateToProps, mapDispatchToProps)(User);