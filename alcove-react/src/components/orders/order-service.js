/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios';

export default {
  service: axios.create({
    baseURL: `${process.env.REACT_APP_APIURL || ""}/api`,
    withCredentials: true
  }),

  getOrders() {
    console.log('process.env:',process.env)
    return this.service.get('/orders')
    .then(response => {
      console.log('response:',response.data)
      return response.data})
  },

  getOrder(id){
    return this.service.get(`/orders/${id}`)
    .then(response => {
      return response.data})
  },
  
  updateOrder(orderStatus,id){
    return this.service.put(`/orders/${id}`,{status:orderStatus})
    .then(response => {
      return response.data})
  },
};