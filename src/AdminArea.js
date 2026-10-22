import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import AdminShell from './admin_components/AdminShell'
import DashboardScreen from './screens/DashboardScreen'
import CounterSaleScreen from './screens/inventory/CounterSaleScreen'
import StockScreen from './screens/inventory/StockScreen'
import ReceiveStockScreen from './screens/inventory/ReceiveStockScreen'
import SalesScreen from './screens/inventory/SalesScreen'
import OrderListScreen from './screens/OrderListScreen'
import OrderScreen from './screens/OrderScreen'
import ProductListScreen from './screens/ProductListScreen'
import ProductEditScreen from './screens/ProductEditScreen'
import BrandScreen from './screens/BrandScreen'
import UserListScreen from './screens/UserListScreen'
import UserEditScreen from './screens/UserEditScreen'
import AdminContactScreen from './screens/AdminContactScreen'
import SettingsScreen from './screens/SettingsScreen'
import WebsiteScreen from './screens/WebsiteScreen'
import DeliverySettingsScreen from './screens/DeliverySettingsScreen'
import GstReportScreen from './screens/GstReportScreen'

// Every admin page, inside the admin frame. This file is loaded separately from the
// shop, so customers never download the admin pages, charts or text editor.
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
        <Route path='/admin/product/new' component={ProductEditScreen} />
        <Route path='/admin/product/:id/edit' component={ProductEditScreen} />
        <Route path='/brand' component={BrandScreen} />
        <Route path='/admin/staff' component={UserListScreen} />
        <Route path='/admin/customers' component={UserListScreen} />
        <Redirect from='/admin/userlist' to='/admin/customers' />
        <Route path='/admin/user/:id/edit' component={UserEditScreen} />
        <Route path='/admin/contact' component={AdminContactScreen} />
        <Route path='/admin/settings' component={SettingsScreen} />
        <Route path='/admin/delivery' component={DeliverySettingsScreen} />
        <Route path='/admin/gst' component={GstReportScreen} />
        <Route path='/admin/website' component={WebsiteScreen} />
        <Redirect to='/dashboard' />
      </Switch>
    </AdminShell>
  )
}

export default AdminArea
