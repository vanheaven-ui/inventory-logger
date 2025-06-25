import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const { t } = useLanguage(); // Get translation function

  useEffect(() => {
    const loadTransactions = async () => {
      const stored = await AsyncStorage.getItem('transactions');
      const parsed = stored ? JSON.parse(stored) : [];
      // Sort by newest first
      setTransactions(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };
    loadTransactions();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.details}>
        {item.type === 'sell' ? t('sold') : t('restocked')}: {item.quantity}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('transaction_history')}</Text>
      {transactions.length === 0 ? (
        <Text style={styles.noData}>{t('no_transactions')}</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#f9f9f9' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  noData: { color: '#888', textAlign: 'center', marginTop: 50 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { color: '#555', marginTop: 4 },
  timestamp: { fontSize: 12, color: '#888', marginTop: 8 }
});
