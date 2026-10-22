import axios from 'axios'
import { logout } from './actions/userActions'
import { activeBusiness } from './admin_components/roles'
import { isPreview } from './components/siteContent'

const inAdminArea = () => /^#\/(admin|dashboard|brand)/.test(window.location.hash)

// Admin pages tell the server which business they are working in. The server checks this
// against the person's own memberships, so it only chooses between businesses they belong to.
// The public shop is chosen separately (by its web address, from Phase 5); the website
// editor's preview frame shows the business being edited.
export function installBusinessHeader(store) {
    axios.interceptors.request.use((config) => {
        const { userInfo } = store.getState().userLogin
        const slug = (inAdminArea() || isPreview()) && activeBusiness(userInfo)
        if (slug && config.url && config.url.startsWith('/api/')) {
            config.headers = { ...config.headers, 'X-Business': slug }
        }
        return config
    })
}

// When the server rejects a saved login (expired or invalid token),
// sign the person out and send them to the right login page instead of showing an error.
export default function installAuthInterceptor(store) {
    installBusinessHeader(store)
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const res = error.response
            const invalidToken = res && res.status === 401 && res.data && res.data.code === 'token_not_valid'
            if (invalidToken && store.getState().userLogin.userInfo) {
                store.dispatch(logout())
                // Staff working in the admin area go back to the staff sign-in.
                window.location.hash = inAdminArea() ? '#/staff' : '#/login'
            }
            return Promise.reject(error)
        }
    )
}
