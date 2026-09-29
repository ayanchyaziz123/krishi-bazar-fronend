import axios from 'axios'
import { logout } from './actions/userActions'

// When the server rejects a saved login (expired or invalid token),
// sign the customer out and send them to the login page instead of showing an error.
export default function installAuthInterceptor(store) {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const res = error.response
            const invalidToken = res && res.status === 401 && res.data && res.data.code === 'token_not_valid'
            if (invalidToken && store.getState().userLogin.userInfo) {
                store.dispatch(logout())
                window.location.hash = '#/login'
            }
            return Promise.reject(error)
        }
    )
}
