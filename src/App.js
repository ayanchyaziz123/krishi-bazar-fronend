import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ChatAssistant from './components/ChatAssistant'
import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen'
import CartScreen from './screens/CartScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import ShippingScreen from './screens/ShippingScreen'
import PaymentScreen from './screens/PaymentScreen'
import PlaceOrderScreen from './screens/PlaceOrderScreen'
import OrderScreen from './screens/OrderScreen'
import UserListScreen from './screens/UserListScreen'
import UserEditScreen from './screens/UserEditScreen'
import ProductListScreen from './screens/ProductListScreen'
import ProductEditScreen from './screens/ProductEditScreen'
import OrderListScreen from './screens/OrderListScreen'
import TopReviewProductScreen from './screens/TopReviewProductScreen'
import Contact from './screens/ContactScreen'
import CompareScreen from './screens/CompareScreen'
import PriceRangeScreen from './screens/PriceRangeScreen'
import DashboardScreen from './screens/DashboardScreen'
import OTPScreen from './screens/OTPScreen';
import RegisterScreen2 from './screens/RegisterScreen2'
import ResetPassword from './screens/ResetPassword';
import AdminContactScreen from './screens/AdminContactScreen';
import BrandScreen from './screens/BrandScreen'
import CounterSaleScreen from './screens/inventory/CounterSaleScreen'
import StockScreen from './screens/inventory/StockScreen'
import ReceiveStockScreen from './screens/inventory/ReceiveStockScreen'
import SalesScreen from './screens/inventory/SalesScreen'
import withAdminGate from './inventory/AdminGate'

import AdminShell from './admin_components/AdminShell'

// Every admin page lives inside the admin frame instead of the storefront header and footer.
const ADMIN_PATHS = ['/admin', '/dashboard', '/brand']

function AdminArea() {
  return (
    <AdminShell>
      <Switch>
        <Route path='/dashboard' component={DashboardScreen} />
        <Route path='/admin/counter' component={CounterSaleScreen} />
        <Route path='/admin/stock' component={StockScreen} />
        <Route path='/admin/receive' component={ReceiveStockScreen} />
        <Route path='/admin/sales' component={SalesScreen} />
        <Route path='/admin/orderlist' component={OrderListScreen} />
        <Route path='/admin/order/:id' component={OrderScreen} />
        <Route path='/admin/productlist' component={ProductListScreen} />
        <Route path='/admin/product/:id/edit' component={ProductEditScreen} />
        <Route path='/brand' component={BrandScreen} />
        <Route path='/admin/userlist' component={UserListScreen} />
        <Route path='/admin/user/:id/edit' component={UserEditScreen} />
        <Route path='/admin/contact' component={AdminContactScreen} />
        <Redirect to='/dashboard' />
      </Switch>
    </AdminShell>
  )
}

const AdminAreaGated = withAdminGate(AdminArea)

function App() {
  return (
    <Router>
      <Switch>
        <Route path={ADMIN_PATHS} component={AdminAreaGated} />
        <Route>
          <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1 py-8 sm:py-10">
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
            </main>
            <Footer />
            <ChatAssistant />
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
