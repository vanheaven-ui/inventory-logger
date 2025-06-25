import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TransactionForm from '../components/TransactionForm';
import { useLanguage } from '../context/LaguageContext';

export default function TransactionScreen({ route }) {
  const { type } = route.params;
  const { t } = useLanguage(); // Get translation function

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>
        {type === 'sell' ? t('record_a_sale') : t('record_a_restock')}
      </Text>
      <TransactionForm type={type} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    color: '#333', // Darken text for contrast
  }
});
