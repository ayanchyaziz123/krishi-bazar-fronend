import { HashRouter as Router, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
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

          <Route path='/admin/userlist' component={UserListScreen} />
          <Route path='/admin/user/:id/edit' component={UserEditScreen} />

          <Route path='/admin/productlist' component={ProductListScreen} />
          <Route path='/admin/product/:id/edit' component={ProductEditScreen} />

          <Route path='/admin/orderlist' component={OrderListScreen} />
          <Route path='/topReviewProductScreen' component={TopReviewProductScreen}/>
          <Route path='/contact' component={Contact}/>
          <Route path='/priceRange' component={PriceRangeScreen} />
          <Route path='/dashboard' component={DashboardScreen} />
        <Route path='/admin/contact' component={AdminContactScreen} />
        <Route path="/brand" component={BrandScreen} />
          
      
      </main>
      <Footer />
      <ChatAssistant />
      </div>
    </Router>
  );
}

export default App;
