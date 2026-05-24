import React, { useEffect, useState } from 'react';

import {
  View,
 Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { adminGet } from '../../services/adminApi';

import { connectAdminSocket } from '../../services/socketService';

import socket from '../../services/socketService';

const AdminDashboardScreen = () => {
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState(null);

  const [realtimeLogins, setRealtimeLogins] = useState([]);

  const loadDashboard = async () => {
    try {
      const response = await adminGet('/admin/dashboard/metrics');

      console.log('REAL METRICS', response);

      setMetrics(response?.data);
    } catch (error) {
      console.log('DASHBOARD ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    connectAdminSocket();

    socket.on('user-login', data => {
      console.log('REALTIME USER LOGIN', data);

      setRealtimeLogins(prev => [data, ...prev]);
    });

    socket.on('new-order', data => {
      console.log('REALTIME ORDER', data);
    });

    return () => {
      socket.off('user-login');
      socket.off('new-order');
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Admin Dashboard
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          Total Users: {metrics?.totalUsers || 0}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          Total Orders: {metrics?.totalOrders || 0}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          Total Products: {metrics?.productCount || 0}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          Revenue: ₹{metrics?.revenue || 0}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Realtime User Logins
      </Text>

      {realtimeLogins.length === 0 ? (
        <View style={styles.card}>
          <Text>No realtime logins yet</Text>
        </View>
      ) : (
        realtimeLogins.map((item, index) => (
          <View style={styles.card} key={index}>
            <Text style={styles.cardText}>
              {item?.name}
            </Text>

            <Text>
              {item?.email}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#f3f4f6',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },

  cardText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;