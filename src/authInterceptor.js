import axios from 'axios'
import { logout } from './actions/userActions'

// When the server rejects a saved login (expired or invalid token),
// sign the person out and send them to the right login page instead of showing an error.
export default function installAuthInterceptor(store) {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const res = error.response
            const invalidToken = res && res.status === 401 && res.data && res.data.code === 'token_not_valid'
            if (invalidToken && store.getState().userLogin.userInfo) {
                store.dispatch(logout())
                // Staff working in the admin area go back to the staff sign-in.
                const inAdmin = /^#\/(admin|dashboard|brand)/.test(window.location.hash)
                window.location.hash = inAdmin ? '#/staff' : '#/login'
            }
            return Promise.reject(error)
        }
    )
}
