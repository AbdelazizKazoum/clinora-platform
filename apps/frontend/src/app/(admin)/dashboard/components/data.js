import product1 from '@/assets/images/products/1.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'
import product7 from '@/assets/images/products/7.png'
import product8 from '@/assets/images/products/8.png'
import product9 from '@/assets/images/products/9.png'
import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
import { getColor, getFont } from '@/utils/helpers'
export const stateData = [
  {
    icon: 'tabler:credit-card',
    className: 'bg-primary-subtle text-primary',
    prefix: '$',
    value: 12.47,
    suffix: 'K',
    title: "Today's Revenue",
  },
  {
    icon: 'tabler:calendar-check',
    className: 'bg-success-subtle text-success',
    value: 58,
    title: 'Appointments Today',
  },
  {
    icon: 'tabler:users',
    className: 'bg-info-subtle text-info',
    value: 839,
    title: 'Active Patients',
  },
  {
    icon: 'tabler:clock-hour-4',
    className: 'bg-warning-subtle text-warning',
    value: 12,
    title: 'Waiting Patients',
  },
]
export const multiPieChart = () => ({
  data: {
    labels: ['General Dentistry', 'Orthodontics', 'Endodontics', 'Oral Surgery'],
    datasets: [
      {
        label: '2024',
        data: [300, 150, 100, 80],
        backgroundColor: [getColor('chart-primary'), getColor('chart-secondary'), getColor('chart-alpha'), getColor('chart-gray')],
        borderColor: 'transparent',
        borderWidth: 1,
        weight: 1,
        cutout: '30%',
        radius: '90%',
      },
      {
        label: '2023',
        data: [270, 135, 90, 72],
        backgroundColor: [getColor('chart-primary-rgb', 0.3), getColor('chart-secondary-rgb', 0.3), getColor('chart-alpha-rgb', 0.3), getColor('chart-gray-rgb', 0.3)],
        borderColor: 'transparent',
        borderWidth: 3,
        weight: 0.8,
        cutout: '30%',
        radius: '60%',
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: getFont(),
          },
          color: getColor('secondary-color'),
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            return `${ctx.dataset.label} - ${ctx.label}: ${ctx.parsed}`
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  },
})
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const generateRandomData = (min, max) =>
  Array.from(
    {
      length: 12,
    },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  )
const newAppointments = generateRandomData(35, 55)
const followUpAppointments = generateRandomData(20, 40)
const plannedCapacity = generateRandomData(70, 90)
export const salesAnalyticsChart = () => ({
  data: {
    labels: months,
    datasets: [
      {
        type: 'bar',
        label: 'New Appointments',
        data: newAppointments,
        borderColor: getColor('chart-primary'),
        backgroundColor: getColor('chart-primary'),
        stack: 'sales',
        barThickness: 20,
        borderRadius: 6,
      },
      {
        type: 'bar',
        label: 'Follow-up Appointments',
        data: followUpAppointments,
        borderColor: getColor('chart-gray'),
        backgroundColor: getColor('chart-gray'),
        stack: 'sales',
        barThickness: 20,
        borderRadius: 6,
      },
      {
        type: 'line',
        label: 'Planned Capacity',
        data: plannedCapacity,
        borderColor: getColor('chart-alpha'),
        backgroundColor: getColor('chart-alpha-rgb', 0.2),
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        yAxisID: 'y',
      },
    ],
  },
})
export const productData = [
  {
    id: 1,
    image: product1,
    name: 'Examination Gloves',
    category: 'PPE',
    stock: '180 boxes',
    price: '$12.90',
    ratings: 4,
    reviews: 52,
    status: 'Active',
    statusVariant: 'success',
  },
  {
    id: 2,
    image: product2,
    name: 'Dental Bibs',
    category: 'Consumables',
    stock: '45 packs',
    price: '$18.00',
    ratings: 3,
    reviews: 11,
    status: 'Low Stock',
    statusVariant: 'warning',
  },
  {
    id: 3,
    image: product3,
    name: 'Composite Resin',
    category: 'Restorative',
    stock: '0 kits',
    price: '$89.99',
    ratings: 4.5,
    reviews: 8,
    status: 'Out of Stock',
    statusVariant: 'danger',
  },
  {
    id: 4,
    image: product4,
    name: 'Local Anesthetic',
    category: 'Medication',
    stock: '32 boxes',
    price: '$42.00',
    ratings: 3,
    reviews: 16,
    status: 'Limited',
    statusVariant: 'warning',
  },
  {
    id: 5,
    image: product5,
    name: 'Prophylaxis Paste',
    category: 'Preventive',
    stock: '85 cups',
    price: '$24.00',
    ratings: 4,
    reviews: 112,
    status: 'Active',
    statusVariant: 'success',
  },
  {
    id: 6,
    image: product6,
    name: 'Suction Tips',
    category: 'Consumables',
    stock: '25 packs',
    price: '$16.99',
    ratings: 4.5,
    reviews: 78,
    status: 'Low Stock',
    statusVariant: 'warning',
  },
  {
    id: 7,
    image: product7,
    name: 'Fluoride Varnish',
    category: 'Preventive',
    stock: '0 packs',
    price: '$49.99',
    ratings: 3.5,
    reviews: 34,
    status: 'Out of Stock',
    statusVariant: 'danger',
  },
  {
    id: 8,
    image: product8,
    name: 'Sterilization Pouches',
    category: 'Sterilization',
    stock: '142 packs',
    price: '$29.00',
    ratings: 5,
    reviews: 64,
    status: 'Active',
    statusVariant: 'success',
  },
  {
    id: 9,
    image: product9,
    name: 'Impression Material',
    category: 'Prosthodontics',
    stock: '58 kits',
    price: '$74.95',
    ratings: 4,
    reviews: 40,
    status: 'Active',
    statusVariant: 'success',
  },
]
export const orderData = [
  {
    id: 'APT-2001',
    userImage: user1,
    userName: 'Alice Cooper',
    product: 'Dental Cleaning',
    date: '2025-05-01',
    amount: '$199.99',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2002',
    userImage: user2,
    userName: 'David Lee',
    product: 'Routine Examination',
    date: '2025-04-30',
    amount: '$349.00',
    status: 'Pending',
    statusVariant: 'warning',
  },
  {
    id: 'APT-2003',
    userImage: user3,
    userName: 'Sophia Turner',
    product: 'Composite Filling',
    date: '2025-04-29',
    amount: '$89.49',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2004',
    userImage: user4,
    userName: 'James Wilson',
    product: 'Root Canal Consultation',
    date: '2025-04-28',
    amount: '$450.00',
    status: 'Cancelled',
    statusVariant: 'danger',
  },
  {
    id: 'APT-2005',
    userImage: user5,
    userName: 'Ava Carter',
    product: 'Teeth Whitening',
    date: '2025-04-27',
    amount: '$129.99',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2011',
    userImage: user6,
    userName: 'Ethan Brooks',
    product: 'Orthodontic Check-up',
    date: '2025-05-02',
    amount: '$299.00',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2012',
    userImage: user7,
    userName: 'Mia Clarke',
    product: 'Crown Fitting',
    date: '2025-05-01',
    amount: '$59.99',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2013',
    userImage: user8,
    userName: 'Lucas Perry',
    product: 'Dental X-ray',
    date: '2025-04-30',
    amount: '$149.99',
    status: 'Pending',
    statusVariant: 'warning',
  },
  {
    id: 'APT-2014',
    userImage: user9,
    userName: 'Chloe Adams',
    product: 'Periodontal Treatment',
    date: '2025-04-29',
    amount: '$45.00',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    id: 'APT-2015',
    userImage: user10,
    userName: 'Benjamin Gray',
    product: 'Emergency Consultation',
    date: '2025-04-28',
    amount: '$75.49',
    status: 'Completed',
    statusVariant: 'success',
  },
]
