import React, { Suspense, lazy } from 'react'
import { HashRouter as Router, Route, Switch, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ChatAssistant from './components/ChatAssistant'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/Loader'
import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen'
import CartScreen from './screens/CartScreen'
import LoginScreen from './screens/LoginScreen'
import withAdminGate from './inventory/AdminGate'
import BottomNav, { BottomNavSpacer } from './components/shop/BottomNav'
import { Toaster } from './components/ui'

// Loaded only when someone opens them, so the shop's first visit stays small.
const AdminArea = lazy(() => import('./AdminArea'))
const StaffLoginScreen = lazy(() => import('./screens/StaffLoginScreen'))
const RegisterScreen = lazy(() => import('./screens/RegisterScreen'))
const RegisterScreen2 = lazy(() => import('./screens/RegisterScreen2'))
const ResetPassword = lazy(() => import('./screens/ResetPassword'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const OTPScreen = lazy(() => import('./screens/OTPScreen'))
const CompareScreen = lazy(() => import('./screens/CompareScreen'))
const ShippingScreen = lazy(() => import('./screens/ShippingScreen'))
const PaymentScreen = lazy(() => import('./screens/PaymentScreen'))
const PlaceOrderScreen = lazy(() => import('./screens/PlaceOrderScreen'))
const OrderScreen = lazy(() => import('./screens/OrderScreen'))
const TopReviewProductScreen = lazy(() => import('./screens/TopReviewProductScreen'))
const Contact = lazy(() => import('./screens/ContactScreen'))
const PriceRangeScreen = lazy(() => import('./screens/PriceRangeScreen'))
const SitePageScreen = lazy(() => import('./screens/SitePageScreen'))
const CategoryScreen = lazy(() => import('./screens/CategoryScreen'))
const StoreScreen = lazy(() => import('./screens/StoreScreen'))

// A crash on one page shows a message with a way out; moving to another page clears it.
function PageBoundary({ children, fullPage }) {
  const { pathname } = useLocation()
  return <ErrorBoundary resetKey={pathname} fullPage={fullPage}>{children}</ErrorBoundary>
}

// Every admin page lives inside the admin frame instead of the storefront header and footer.
const ADMIN_PATHS = ['/admin', '/dashboard', '/brand']

const AdminAreaGated = withAdminGate(AdminArea)


function App() {
  return (
    <Router>
      <PageBoundary fullPage>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader /></div>}>
      <Switch>
        <Route path='/staff' component={StaffLoginScreen} />
        <Route path={ADMIN_PATHS} component={AdminAreaGated} />
        <Route>
          <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1 py-4 sm:py-8 md:py-10">
              <PageBoundary>
              <Suspense fallback={<Loader />}>
              <Route path='/' component={HomeScreen} exact />
              <Route path='/login' component={LoginScreen} />
              <Route path='/register' component={RegisterScreen} />
              <Route path='/register2' component={RegisterScreen2} />
              <Route path='/reset_password' component={ResetPassword} />
              <Route path='/profile' component={ProfileScreen} />
              <Route path='/otp_screen' component={OTPScreen} />
              <Route path='/compare' component={CompareScreen} />
              <Route path='/shipping' component={ShippingScreen} />
              <Route path='/placeorder' component={PlaceOrderScreen} />
              <Route path='/order/:id' component={OrderScreen} />
              <Route path='/payment' component={PaymentScreen} />
              <Route path='/product/:id' component={ProductScreen} />
              <Route path='/cart/:id?' component={CartScreen} />
              <Route path='/topReviewProductScreen' component={TopReviewProductScreen} />
              <Route path='/contact' component={Contact} />
              <Route path='/priceRange' component={PriceRangeScreen} />
              <Route path='/page/:slug' component={SitePageScreen} />
              <Route path='/categories' component={CategoryScreen} />
              <Route path='/stores' component={StoreScreen} />
              </Suspense>
              </PageBoundary>
            </main>
            <Footer />
            <BottomNavSpacer />
            <BottomNav />
            <ChatAssistant />
            <Toaster placement="bottom-24 inset-x-3 md:inset-x-auto md:bottom-4 md:right-4" />
          </div>
        </Route>
      </Switch>
      </Suspense>
      </PageBoundary>
    </Router>
  );
}

export default App;
