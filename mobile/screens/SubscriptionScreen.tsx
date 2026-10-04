import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Crown, Smartphone, Building2, Check, Clock } from 'lucide-react-native';
import { subscriptionsApi } from '../utils/subscriptionsApi';

type Plan = {
  id: string; nameEn: string; nameUr: string; scansQuotaDisplay: string;
  monthlyPricePkr: number; yearlyPricePkr: number; featuresEn: string[]; featuresUr: string[]; popular?: boolean;
};

export function SubscriptionScreen({ lang, onBack }: { lang: string; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accounts, setAccounts] = useState<Record<string, { title: string; account: string }>>({});
  const [current, setCurrent] = useState<any>(null);
  const [selected, setSelected] = useState('gold');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [method, setMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [p, c] = await Promise.all([subscriptionsApi.getPlans(), subscriptionsApi.getCurrent()]);
      setPlans(Object.values(p.plans as Record<string, Plan>).filter((x) => x.id !== 'free'));
      setAccounts(p.paymentAccounts || {});
      setCurrent(c.subscription);
    } catch (e: any) {
      setError(e.message || 'Could not reach the server.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const plan = plans.find((p) => p.id === selected);
  const price = plan ? (cycle === 'yearly' ? plan.yearlyPricePkr : plan.monthlyPricePkr) : 0;
  const account = accounts[method];

  const submit = async () => {
    if (!/^[A-Za-z0-9-]{8,40}$/.test(refId.trim())) {
      Alert.alert(isUrdu ? 'ٹرانزیکشن ID' : 'Transaction ID', isUrdu ? 'رسید سے درست ٹرانزیکشن ID درج کریں (8-40 حروف/ہندسے)۔' : 'Enter the transaction ID from your receipt (8-40 letters/numbers).');
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionsApi.subscribe({ plan: selected, billingCycle: cycle, paymentMethod: method, paymentReference: refId.trim() });
      setRefId('');
      Alert.alert(isUrdu ? 'ادائیگی جمع ہو گئی' : 'Payment submitted', isUrdu ? 'تصدیق کے بعد آپ کا پیکج فعال ہو جائے گا۔' : 'Your plan activates once the payment is verified.');
      load();
    } catch (e: any) {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', e.message);
    } finally { setSubmitting(false); }
  };

  const methods = [
    { id: 'easypaisa', name: 'EasyPaisa', Icon: Smartphone },
    { id: 'jazzcash', name: 'JazzCash', Icon: Smartphone },
    { id: 'bank', name: 'Bank Transfer', Icon: Building2 },
  ] as const;

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <ArrowLeft size={20} color="#0f172a" /><Text style={st.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>
      <View style={st.headerRow}><Crown size={22} color="#0f172a" /><Text style={st.title}>{isUrdu ? 'فضل دوست پیکجز' : 'Subscription Plans'}</Text></View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#0f172a" /> : error ? (
        <View style={st.box}>
          <Text style={st.err}>{error}</Text>
          <TouchableOpacity style={st.btn} onPress={load}><Text style={st.btnText}>{isUrdu ? 'دوبارہ کوشش کریں' : 'Retry'}</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          {current?.isPaid && (
            <View style={[st.banner, { backgroundColor: '#0f172a' }]}>
              <Text style={st.bannerT}>{String(current.plan).toUpperCase()} {isUrdu ? 'فعال' : 'ACTIVE'}</Text>
              {!!current.expiresAt && <Text style={st.bannerS}>{isUrdu ? 'تجدید کی تاریخ: ' : 'Expires: '}{new Date(current.expiresAt).toLocaleDateString()}</Text>}
            </View>
          )}
          {!!current?.pending && (
            <View style={[st.banner, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Clock size={16} color="#0f172a" />
                <Text style={[st.bannerT, { color: '#0f172a' }]}>{isUrdu ? 'تصدیق جاری ہے' : 'Payment awaiting verification'}</Text></View>
              <Text style={[st.bannerS, { color: '#475569' }]}>{current.pending.plan} · PKR {current.pending.amountPkr} · {current.pending.paymentReference}</Text>
            </View>
          )}

          <View style={st.toggle}>
            {(['monthly', 'yearly'] as const).map((c) => (
              <TouchableOpacity key={c} style={[st.toggleBtn, cycle === c && st.toggleOn]} onPress={() => setCycle(c)}>
                <Text style={[st.toggleT, cycle === c && { color: '#fff' }]}>{c === 'monthly' ? (isUrdu ? 'ماہانہ' : 'Monthly') : (isUrdu ? 'سالانہ (29% بچت)' : 'Yearly (29% off)')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {plans.map((p) => {
            const on = selected === p.id;
            const f = isUrdu ? p.featuresUr : p.featuresEn;
            return (
              <TouchableOpacity key={p.id} style={[st.planCard, on && st.planOn]} onPress={() => setSelected(p.id)}>
                <View style={st.planHeader}>
                  <Text style={[st.planTitle, on && st.white]}>{isUrdu ? p.nameUr : p.nameEn}</Text>
                  {on && <Check size={18} color="#fff" />}
                </View>
                <Text style={[st.planScans, on && { color: '#cbd5e1' }]}>{p.scansQuotaDisplay}</Text>
                <Text style={[st.planPrice, on && st.white]}>PKR {(cycle === 'yearly' ? p.yearlyPricePkr : p.monthlyPricePkr).toLocaleString()} / {cycle === 'yearly' ? (isUrdu ? 'سال' : 'yr') : (isUrdu ? 'ماہ' : 'mo')}</Text>
                {f.map((x, i) => <Text key={i} style={[st.feat, on && { color: '#e2e8f0' }]}>• {x}</Text>)}
              </TouchableOpacity>
            );
          })}

          <View style={st.box}>
            <Text style={st.label}>{isUrdu ? 'ادائیگی کا طریقہ' : 'Payment method'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {methods.map(({ id, name, Icon }) => (
                <TouchableOpacity key={id} style={[st.gw, method === id && st.gwOn]} onPress={() => setMethod(id)}>
                  <Icon size={16} color={method === id ? '#fff' : '#64748b'} />
                  <Text style={[st.gwT, method === id && { color: '#fff' }]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.payTo}>
              {account ? (
                <Text style={st.payToT}>{isUrdu ? 'PKR ' : 'Send PKR '}{price.toLocaleString()}{isUrdu ? ' اس اکاؤنٹ میں بھیجیں: ' : ' to: '}{account.title} — {account.account}</Text>
              ) : (
                <Text style={st.payToT}>{isUrdu ? 'یہ طریقہ فی الحال دستیاب نہیں۔' : 'This payment method is not available right now.'}</Text>
              )}
            </View>
            <Text style={st.label}>{isUrdu ? 'ادائیگی کے بعد رسید کی ٹرانزیکشن ID' : 'After paying, enter the transaction ID'}</Text>
            <TextInput style={st.input} placeholder="e.g. 12345678901" autoCapitalize="characters" value={refId} onChangeText={setRefId} />
            <TouchableOpacity style={[st.btn, (!account || submitting || !!current?.pending) && { opacity: 0.5 }]} onPress={submit} disabled={!account || submitting || !!current?.pending}>
              <Text style={st.btnText}>{submitting ? (isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...') : (isUrdu ? 'ادائیگی جمع کروائیں' : 'Submit payment for verification')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  banner: { padding: 14, borderRadius: 16, marginBottom: 12 },
  bannerT: { fontSize: 13, fontWeight: '900', color: '#fff' },
  bannerS: { fontSize: 11, color: '#cbd5e1', marginTop: 4 },
  toggle: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleOn: { backgroundColor: '#0f172a' },
  toggleT: { fontSize: 12, fontWeight: '800', color: '#475569' },
  planCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  planOn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  planScans: { fontSize: 12, color: '#64748b', marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginVertical: 8 },
  feat: { fontSize: 12, color: '#475569', marginTop: 2 },
  white: { color: '#fff' },
  box: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  gw: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 4 },
  gwOn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  gwT: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  payTo: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 14 },
  payToT: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 14, color: '#0f172a' },
  btn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  err: { color: '#b91c1c', fontSize: 13, marginBottom: 12 },
});
