import React from 'react';
import TransactionForm from '../components/TransactionForm';
import { saveTransaction } from '../storage/transactionStorage';

export default function SellScreen({ navigation }) {
  const handleSubmit = (data) => {
    saveTransaction('sell', data);
    navigation.goBack();
  };

  return <TransactionForm type="sell" onSubmit={handleSubmit} />;
}
