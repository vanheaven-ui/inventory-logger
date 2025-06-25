import React from "react";
import TransactionForm from "../components/TransactionForm";
import { saveTransaction } from "../storage/transactionStorage";

export default function RestockScreen({ navigation }) {
  const handleSubmit = (data) => {
    saveTransaction("restock", data);
    navigation.goBack();
  };

  return <TransactionForm type="restock" onSubmit={handleSubmit} />;
}
