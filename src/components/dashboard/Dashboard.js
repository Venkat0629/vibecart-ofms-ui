import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';
import { VIBECART_URI } from '../Services/service';

const COLORS = ['#dd1e25', '#fbb3b5', '#c1121f', '#f08080'];

function Dashboard() {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [totalOffers, setTotalOffers] = useState(0);
  const [activeOffers, setActiveOffers] = useState(0);
  const [expiredOffers, setExpiredOffers] = useState(0);

  useEffect(() => {
    fetch(`${VIBECART_URI}/api/v1/vibe-cart/offers`)
      .then(response => response.json())
      .then(data => {
        const filteredData = data.filter(offer => offer.offerStatus !== "SHELVED");

        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 2);

        const filteredByDate = filteredData.filter(offer => {
          const offerDate = new Date(offer.offerCreatedAt);
          return offerDate >= threeMonthsAgo && offerDate <= currentDate;
        });

        setTotalOffers(filteredByDate.length);

        const monthlyData = filteredByDate.reduce((acc, offer) => {
          const month = new Date(offer.offerStartDate).toLocaleString('default', { month: 'short' });
          if (!acc[month]) {
            acc[month] = { name: month, ProductOffers: 0, SeasonalPromotion: 0, PriceDiscounts: 0 };
          }

          // Use offerUsageQuantity instead of just counting offers
          const usageQuantity = offer.offerUsageQuantity || 0;

          if (offer.offerItems && Array.isArray(offer.offerItems) && offer.offerItems.length > 0) {
            switch (offer.offerItems[0].offerType) {
              case 'ITEM_OFFER':
                acc[month].ProductOffers += usageQuantity;
                break;
              case 'SKU_OFFER':
                acc[month].SeasonalPromotion += usageQuantity;
                break;
              case 'ON_BILL_AMOUNT':
              case 'DISCOUNT_COUPONS':
                acc[month].PriceDiscounts += usageQuantity;
                break;
              default:
                break;
            }
          }
          return acc;
        }, {});

        const allMonths = [];
        for (let m = 0; m < 3; m++) {
          const month = new Date();
          month.setMonth(currentDate.getMonth() - m);
          const monthName = month.toLocaleString('default', { month: 'short' });
          allMonths.push(monthName);
        }

        const barChartData = allMonths.map(month => monthlyData[month] || { name: month, ProductOffers: 0, SeasonalPromotion: 0, PriceDiscounts: 0 });

        const pieChartData = [
          { name: 'Product Offers', value: barChartData.reduce((sum, month) => sum + month.ProductOffers, 0) },
          { name: 'Seasonal Promotion', value: barChartData.reduce((sum, month) => sum + month.SeasonalPromotion, 0) },
          { name: 'Price Discounts', value: barChartData.reduce((sum, month) => sum + month.PriceDiscounts, 0) },
        ];

        setBarData(barChartData);
        setPieData(pieChartData);

        const active = filteredData.filter(offer => offer.offerStatus === "ACTIVE").length;
        const expired = filteredData.filter(offer => offer.offerStatus === "EXPIRED").length;

        setActiveOffers(active);
        setExpiredOffers(expired);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="container mt-4" style={{ fontSize: '14px' }}>
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-header bg-light-grey font-weight-bold">
              Total offers
            </div>
            <div className="card-body">
              <h1 className="card-title">{totalOffers}</h1>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-header bg-light-grey font-weight-bold">
              Active offers
            </div>
            <div className="card-body">
              <h1 className="card-title">{activeOffers}</h1>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-header bg-light-grey font-weight-bold">
              Expired offers
            </div>
            <div className="card-body">
              <h1 className="card-title">{expiredOffers}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-light-grey text-center font-weight-bold">
              Last 3 Months Used Offers
            </div>
            <div className="card-body p-3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ProductOffers" fill={COLORS[0]} />
                  <Bar dataKey="SeasonalPromotion" fill={COLORS[1]} />
                  <Bar dataKey="PriceDiscounts" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-light-grey text-center font-weight-bold">
              Most Used Offer Types
            </div>
            <div className="card-body p-3">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={90}
                    fill={COLORS[3]}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
