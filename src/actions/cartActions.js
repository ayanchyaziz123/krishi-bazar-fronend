import axios from 'axios'
import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_SAVE_SHIPPING_ADDRESS,

    CART_SAVE_PAYMENT_METHOD,
} from '../constants/cartConstants'


export const addToCart = (id, qty) => async (dispatch, getState) => {
    
    const { data } = await axios.get(`/api/products/${id}`)

    dispatch({
        type: CART_ADD_ITEM,
        payload: {
            product: data.product._id,
            name: data.product.name,
            image: data.product.image,
            // The website price before any offer; the cart applies the offer once.
            price: Number(data.product.price),
            offer_percentage: data.product.is_offer ? data.product.offer_percentage : 0,
            countInStock: data.product.countInStock,
            // Loose items (sold by weight) come in steps of 0.5 online.
            sold_by_weight: Boolean(data.product.sold_by_weight),
            unit: data.product.unit || '',
            gst_rate: Number(data.product.gst_rate) || 0,
            qty
        }
    })
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}



export const removeFromCart = (id) => (dispatch, getState) => {
    dispatch({
        type: CART_REMOVE_ITEM,
        payload: id,
    })

    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}


export const saveShippingAddress = (data) => (dispatch) => {
    dispatch({
        type: CART_SAVE_SHIPPING_ADDRESS,
        payload: data,
    })

    localStorage.setItem('shippingAddress', JSON.stringify(data))
}

export const savePaymentMethod = (data) => (dispatch) => {
    dispatch({
        type: CART_SAVE_PAYMENT_METHOD,
        payload: data,
    })

    localStorage.setItem('paymentMethod', JSON.stringify(data))
}