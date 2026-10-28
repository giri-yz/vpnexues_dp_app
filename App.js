import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Image, Linking, Animated,
  StyleSheet, Switch, Modal, KeyboardAvoidingView, Platform, BackHandler, useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

/* ───────── constants & theme ───────── */
const SUPPORT = '+914400000000';
const C = {
  ink: '#0B2E1F', ink2: '#4B6B5C', line: '#BFE0CD', sign: '#1FA463', ok: '#128A4F',
  bad: '#D64545', tint: '#F1FAF4', soft: '#CDEFDB', dark: '#052116',
};
const DG = ['#127A48', '#0B4A2E', '#052116'];
const GO = ['#0B4A2E', '#04140D'];
const DISP = { fontWeight: '800', letterSpacing: -0.2, color: C.ink };

const QUOTES = [
  'Deliver good food with love.',
  'Every bag you carry is someone’s meal and someone’s smile.',
  'Handle with care, deliver with love.',
  'Be on time, be kind, be the reason their day gets better.',
  'Safe riding beats fast riding. Someone is waiting for you too.',
  'You don’t just deliver orders, you deliver happiness.',
  'A warm smile at the door is the best delivery.',
  'Slow down, stay safe, spread smiles.',
  'Fresh food, warm heart, happy customer.',
  'Your hard work feeds families. Thank you!',
];

const INITIAL_ORDERS = [
  { id: 'DX-4821', name: 'Meera Raghavan', phone: '+919800000001', addr: 'Flat 4B, Lotus Apartments, 12th Main Rd, Anna Nagar, Chennai 600040', dist: '2.4 km', eta: '12 min', pay: 'Prepaid', otp: '4821', bags: 3, cold: true, store: 'VPNexues Store, 2nd Avenue, Anna Nagar, Chennai', potp: '3306' },
  { id: 'DX-4822', name: 'Karthik S', phone: '+919800000002', addr: '28, South Usman Rd, T. Nagar, Chennai 600017', dist: '5.1 km', eta: '24 min', pay: 'Cash ₹640', otp: '7305', bags: 2, cold: false, store: 'VPNexues Store, Usman Road, T. Nagar, Chennai', potp: '5512' },
  { id: 'DX-4823', name: 'Divya Menon', phone: '+919800000003', addr: 'Plot 9, 3rd Cross St, Besant Nagar, Chennai 600090', dist: '7.8 km', eta: '33 min', pay: 'Prepaid', otp: '1190', bags: 1, cold: true, store: 'VPNexues Store, Besant Nagar, Chennai', potp: '9047' },
];
const NEW_ORDER = { id: 'DX-4824', name: 'Suresh Babu', phone: '+919800000004', addr: '15, Lake View Rd, Adyar, Chennai 600020', dist: '3.2 km', eta: '18 min', pay: 'Prepaid', otp: '2468', bags: 2, cold: false, store: 'VPNexues Store, Adyar, Chennai', potp: '7781' };
const INITIAL_DONE = [
  { id: 'DX-4790', name: 'Arun P', time: '10:42 am', earn: 68, otp: 'OTP', pay: 'Prepaid' },
  { id: 'DX-4788', name: 'Lakshmi V', time: '9:55 am', earn: 54, otp: 'Support approved', pay: 'Cash ₹320' },
];
const RETURN_REASONS = ['Customer refused the order', 'Customer unreachable', 'Wrong or unfindable address', 'Customer not at home', 'Other'];

const RANGES = {
  day: { u: 'day', t: 'Last 7 days', l: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Today'], v: [640, 585, 720, 910, 860, 540], n: [10, 9, 11, 14, 13, 8], note: 'Green bar is today so far', live: true },
  month: { u: 'month', t: 'Last 6 months', l: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], v: [14200, 15850, 16400, 17900, 18650, 12400], n: [231, 254, 262, 288, 301, 198], note: 'Green bar is this month so far' },
  year: { u: 'year', t: 'Last 4 years', l: ['2023', '2024', '2025', '2026'], v: [112000, 148500, 172300, 141200], n: [1820, 2410, 2790, 2265], note: 'Green bar is this year so far' },
};

/* ───────── helpers ───────── */
const mapUrl = (a) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
const call = (n) => Linking.openURL('tel:' + n).catch(() => {});
const openMap = (a) => Linking.openURL(mapUrl(a)).catch(() => {});
const sum = (a) => a.reduce((x, y) => x + y, 0);
const short = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : '' + n);
function inr(n) {
  let s = String(Math.round(n));
  if (s.length > 3) {
    const last = s.slice(-3);
    let rest = s.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    s = rest + ',' + last;
  }
  return '₹' + s;
}
function nowTime() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}
const newSt = () => ({ otp: '', verified: false, bySupport: false, photo: '', attempts: 0, panel: '', err: '', picked: false, potp: '', perr: '', reason: '', rerr: '' });

/* ───────── icons ───────── */
const IconBox = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
    <Path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><Path d="M3 7.5 12 12l9-4.5M12 12v9" />
  </Svg>
);
const IconCheck = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={9} /><Path d="m8 12.5 3 3 5-6" />
  </Svg>
);
const IconUser = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Circle cx={12} cy={8} r={4} /><Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Svg>
);
const IconChart = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
const IconBack = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 5l-7 7 7 7" />
  </Svg>
);
const PinIcon = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Rect width={44} height={44} rx={10} fill="#CFE3D4" />
    <Path d="M0 30 44 18M14 0l8 44M30 0l-4 44" stroke="#fff" strokeWidth={3} fill="none" />
    <Path d="M22 10a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#E5483B" />
    <Circle cx={22} cy={17} r={2.6} fill="#fff" />
  </Svg>
);

/* ───────── small UI pieces ───────── */
function Btn({ label, onPress, variant, disabled, style, textStyle }) {
  const content = (
    <Text style={[s.btnTxt, (variant === 'pri' || variant === 'go') && { color: '#fff' }, variant === 'warn' && { color: C.bad }, variant === 'sos' && { color: '#fff' }, textStyle]}>{label}</Text>
  );
  const base = [s.btn, disabled && { opacity: 0.4 }, style];
  if (variant === 'pri' || variant === 'go') {
    return (
      <Pressable onPress={disabled ? undefined : onPress} style={[s.btnWrap, disabled && { opacity: 0.4 }, style]}>
        <LinearGradient colors={variant === 'pri' ? DG : GO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btnGrad}>{content}</LinearGradient>
      </Pressable>
    );
  }
  const bg = variant === 'warn' ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.bad } : variant === 'sos' ? { backgroundColor: C.bad } : { backgroundColor: C.soft };
  return <Pressable onPress={disabled ? undefined : onPress} style={[...base, bg]}>{content}</Pressable>;
}

const Tag = ({ children }) => <View style={s.tag}><Text style={s.tagTxt}>{children}</Text></View>;
const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>;
const Err = ({ children }) => <Text style={s.badT}>{children || ' '}</Text>;
const Row = ({ children, style }) => <View style={[s.row, style]}>{children}</View>;
const Grid2 = ({ children, style }) => <View style={[{ flexDirection: 'row', gap: 8 }, style]}>{React.Children.map(children, (c) => <View style={{ flex: 1 }}>{c}</View>)}</View>;
const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

function Hero({ children, style }) {
  return (
    <LinearGradient colors={DG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.cardHero, style]}>{children}</LinearGradient>
  );
}

function Quote({ text, style }) {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    op.setValue(0);
    Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [text]);
  return (
    <LinearGradient colors={DG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.quote, style]}>
      <Text style={s.qm}>“</Text>
      <View style={{ flex: 1 }}>
        <Animated.Text style={[s.qt, { opacity: op }]}>{text}</Animated.Text>
        <Text style={s.qs}>VPNexues · Delivering with love</Text>
      </View>
    </LinearGradient>
  );
}

const TOAST_STYLE = {
  success: { bg: '#47D68C', fg: '#052116', ib: '#052116', ic: '#47D68C', sym: '✓' },
  info: { bg: '#12877E', fg: '#fff', ib: '#fff', ic: '#0B2E1F', sym: 'i' },
  warn: { bg: '#D9A21B', fg: '#2B1A00', ib: '#2B1A00', ic: '#D9A21B', sym: '!' },
  error: { bg: '#C73B3B', fg: '#fff', ib: '#fff', ic: '#0B2E1F', sym: '✕' },
};
function Toasts({ list }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[s.toasts, { top: insets.top + 10 }]}>
      {list.map((t) => {
        const k = TOAST_STYLE[t.type] || TOAST_STYLE.success;
        return (
          <View key={t.id} style={[s.toast, { backgroundColor: k.bg }]}>
            <View style={[s.toastI, { backgroundColor: k.ib }]}><Text style={{ color: k.ic, fontWeight: '800', fontSize: 14 }}>{k.sym}</Text></View>
            <Text style={{ color: k.fg, fontWeight: '600', flex: 1 }}>{t.msg}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ───────── screens ───────── */
function LoginScreen({ quote, onLogin, toast }) {
  const insets = useSafeAreaInsets();
  const mw = Math.min(260, useWindowDimensions().width * 0.62);
  const [ph, setPh] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    const p = ph.replace(/\D/g, '');
    if (p.length < 10) { setErr('Enter your 10-digit mobile number.'); toast('Enter your 10-digit mobile number', 'error'); return; }
    if (pw.length < 4) { setErr('PIN must be at least 4 digits.'); toast('PIN must be at least 4 digits', 'error'); return; }
    setErr('');
    onLogin();
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={DG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.lhero, { paddingTop: insets.top + 40 }]}>
          <Text style={[s.disp, { color: '#D6F3E1', fontWeight: '700', fontSize: 16 }]}>Delivery partner</Text>
          <Text style={{ fontSize: 44, fontWeight: '800', color: '#fff', lineHeight: 48 }}>VPNexues</Text>
          <View style={s.bar} />
          <Quote text={quote} style={{ backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 0 }} />
        </LinearGradient>
        <Image source={require('./login_img.png')} style={[s.mascot, { width: mw, height: mw * 408 / 612 }]} resizeMode="contain" accessibilityLabel="VP Nexues delivery partner peeking over the sign-in box" />
        <View style={s.lform}>
          <Text style={[s.label, { marginTop: 4 }]}>Mobile number</Text>
          <TextInput style={s.input} value={ph} onChangeText={setPh} keyboardType="phone-pad" placeholder="98000 00000" placeholderTextColor="#8AA899" autoComplete="tel" />
          <Text style={s.label}>PIN</Text>
          <TextInput style={s.input} value={pw} onChangeText={(t) => setPw(t.replace(/\D/g, ''))} secureTextEntry keyboardType="number-pad" maxLength={6} placeholder="4–6 digits" placeholderTextColor="#8AA899" />
          <View style={{ minHeight: 28, marginTop: 6 }}><Err>{err}</Err></View>
          <Btn variant="pri" label="Sign in" onPress={submit} />
          <Btn label="Forgot PIN" style={{ marginTop: 8 }} onPress={() => toast('Reset link sent by SMS')} />
          <Muted style={{ marginTop: 16 }}>Demo: any 10-digit number and a 4-digit PIN.</Muted>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PickupCard({ o, st, act }) {
  return (
    <Card>
      <View style={s.head}>
        <Row><Text style={[s.disp, s.hName]}>{o.name}</Text><Tag>Pickup pending</Tag></Row>
        <Muted style={{ marginTop: 2 }}>{o.id} · {o.dist} · {o.eta}</Muted>
      </View>
      <View style={s.body}>
        <View style={s.sec}>
          <Text style={s.h3}>Pick up from</Text>
          <Text style={s.txt}>{o.store}</Text>
          <Pressable style={s.map} onPress={() => openMap(o.store)}>
            <PinIcon />
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: C.ink }}>Open store in Google Maps</Text><Muted>Head to the pickup counter</Muted></View>
          </Pressable>
        </View>
        <View style={s.sec}>
          <Text style={s.h3}>Package</Text>
          <Row><Text style={{ fontWeight: '700', color: C.ink }}>{o.bags} {o.bags > 1 ? 'bags' : 'bag'}</Text>{o.cold && <Tag>Has chilled items</Tag>}</Row>
          <Muted style={{ marginTop: 4 }}>Check the bag count and seals before you leave.</Muted>
        </View>
        <View style={s.sec}>
          <Text style={s.h3}>Store pickup OTP</Text>
          <TextInput style={s.otp} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor="#8AA899" value={st.potp} onChangeText={(t) => act.upd(o.id, { potp: t.replace(/\D/g, '') })} />
          <View style={{ minHeight: 20, marginTop: 4 }}><Err>{st.perr}</Err></View>
          <Btn variant="go" label="Confirm pickup" onPress={() => act.verifyPickup(o.id)} />
          <Muted style={{ marginTop: 6 }}>Demo pickup OTP: {o.potp}</Muted>
          <Btn label="Store can’t share the OTP? Call support" style={{ marginTop: 8 }} onPress={() => call(SUPPORT)} />
        </View>
      </View>
    </Card>
  );
}

function ReturnPanel({ o, st, act }) {
  return (
    <View style={s.panel}>
      <Text style={{ fontWeight: '700', color: C.ink }}>Return this order</Text>
      <Muted style={{ marginTop: 4, marginBottom: 8 }}>Call support first. After confirming, take the bags back to the store.</Muted>
      {RETURN_REASONS.map((r) => (
        <Pressable key={r} onPress={() => act.upd(o.id, { reason: r, rerr: '' })} style={[s.reason, st.reason === r && { borderColor: C.ok, backgroundColor: '#E8F7EE' }]}>
          <View style={[s.radio, st.reason === r && { borderColor: C.ok }]}>{st.reason === r && <View style={s.radioDot} />}</View>
          <Text style={{ color: C.ink, flex: 1 }}>{r}</Text>
        </Pressable>
      ))}
      <View style={{ minHeight: 20, marginTop: 4 }}><Err>{st.rerr}</Err></View>
      <Grid2>
        <Btn label="Call support" onPress={() => call(SUPPORT)} />
        <Btn variant="warn" label="Confirm return" onPress={() => act.doReturn(o.id)} />
      </Grid2>
    </View>
  );
}

function OrderCard({ o, st, act }) {
  if (!st.picked) return <PickupCard o={o} st={st} act={act} />;
  const canFinish = st.verified && !!st.photo;
  return (
    <Card>
      <View style={s.head}>
        <Row><Text style={[s.disp, s.hName, { flex: 1 }]}>{o.name}</Text><Tag>{o.pay}</Tag></Row>
        <Muted style={{ marginTop: 2 }}>{o.id} · {o.dist} · {o.eta}</Muted>
        <Muted style={{ marginTop: 6 }}>{o.addr}</Muted>
      </View>
      {(
        <View style={s.body}>
          <View style={s.sec}>
            <Text style={s.h3}>Delivery address</Text>
            <Text style={s.txt}>{o.addr}</Text>
            <Pressable style={s.map} onPress={() => openMap(o.addr)}>
              <PinIcon />
              <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: C.ink }}>Open in Google Maps</Text><Muted>Turn-by-turn directions</Muted></View>
            </Pressable>
          </View>
          <View style={s.sec}>
            <Text style={s.h3}>Package</Text>
            <Row><Text style={{ fontWeight: '700', color: C.ink }}>{o.bags} {o.bags > 1 ? 'bags' : 'bag'}</Text>{o.cold && <Tag>Has chilled items · deliver quickly</Tag>}</Row>
          </View>
          <Grid2 style={s.sec}>
            <Btn label="Call customer" onPress={() => { act.attempt(o.id, true); call(o.phone); }} />
            <Btn label="Call support" onPress={() => call(SUPPORT)} />
          </Grid2>
          <View style={s.sec}>
            <Text style={s.h3}>Having trouble?</Text>
            <Grid2>
              <Btn variant="warn" label="Customer not picking up" onPress={() => act.panel(o.id, 'noanswer')} textStyle={{ fontSize: 13, textAlign: 'center' }} />
              <Btn variant="warn" label="Customer has no OTP" onPress={() => act.panel(o.id, 'nootp')} textStyle={{ fontSize: 13, textAlign: 'center' }} />
            </Grid2>
            <Btn variant="warn" label="Return this order" style={{ marginTop: 8 }} onPress={() => act.panel(o.id, 'return')} />
            {st.panel === 'noanswer' && (
              <View style={s.panel}>
                <Text style={{ fontWeight: '700', color: C.ink }}>Call attempts: {st.attempts} of 3</Text>
                <Muted style={{ marginTop: 4, marginBottom: 8 }}>Call the customer up to 3 times, a few minutes apart. After that, our support team will take over.</Muted>
                <Grid2>
                  <Btn label="Call again" onPress={() => { act.attempt(o.id); call(o.phone); }} />
                  <Btn variant="pri" label="Call support" disabled={st.attempts < 3} onPress={() => call(SUPPORT)} />
                </Grid2>
              </View>
            )}
            {st.panel === 'nootp' && (
              <View style={s.panel}>
                <Text style={{ fontWeight: '700', color: C.ink }}>Customer can’t share the OTP</Text>
                <Muted style={{ marginTop: 4, marginBottom: 8 }}>Don’t hand over the order yet. Call support, who will verify the customer and tell you how to proceed.</Muted>
                <Btn variant="pri" label="Call support now" onPress={() => call(SUPPORT)} />
                <Btn label="Support approved – continue" style={{ marginTop: 8 }} onPress={() => act.supportOk(o.id)} />
              </View>
            )}
            {st.panel === 'return' && <ReturnPanel o={o} st={st} act={act} />}
          </View>
          <View style={s.sec}>
            <Text style={s.h3}>1. Customer OTP</Text>
            {st.verified ? (
              <Text style={s.okT}>OTP verified{st.bySupport ? ' by support' : ''}</Text>
            ) : (
              <>
                <TextInput style={s.otp} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor="#8AA899" value={st.otp} onChangeText={(t) => act.upd(o.id, { otp: t.replace(/\D/g, '') })} />
                <View style={{ minHeight: 20, marginTop: 4 }}><Err>{st.err}</Err></View>
                <Btn variant="go" label="Verify OTP" onPress={() => act.verify(o.id)} />
                <Muted style={{ marginTop: 6 }}>Demo OTP for this order: {o.otp}</Muted>
              </>
            )}
          </View>
          <View style={s.sec}>
            <Text style={s.h3}>2. Photo proof</Text>
            <Pressable style={s.photo} onPress={() => act.photo(o.id)}>
              <Text style={{ fontWeight: '700', color: C.ink }}>{st.photo ? 'Retake photo' : 'Take photo of delivered order'}</Text>
              {st.photo ? <Image source={{ uri: st.photo }} style={s.photoImg} /> : <Muted style={{ textAlign: 'center' }}>Show the bags at the door or with the customer</Muted>}
            </Pressable>
          </View>
          <View style={s.sec}>
            <Btn variant="pri" label="Complete delivery" disabled={!canFinish} onPress={() => act.finish(o.id)} />
            {!canFinish && <Muted style={{ textAlign: 'center', marginTop: 6 }}>Verify the OTP and add a photo to close this order.</Muted>}
          </View>
        </View>
      )}
    </Card>
  );
}

function OrderRow({ o, st, act }) {
  return (
    <Card>
      <Pressable style={s.head} onPress={() => act.open(o.id)} accessibilityLabel={'Open order ' + o.id}>
        <Row><Text style={[s.disp, s.hName, { flex: 1 }]}>{o.name}</Text><Tag>{o.pay}</Tag></Row>
        <Muted style={{ marginTop: 2 }}>{o.id} · {o.dist} · {o.eta}</Muted>
        <Muted style={{ marginTop: 6 }}>{st.picked ? o.addr : 'Pickup: ' + o.store}</Muted>
        <Row style={{ marginTop: 8 }}>
          <Text style={s.go}>{st.picked ? 'Out for delivery' : 'Pickup pending'}</Text>
          <Text style={s.go}>Open ›</Text>
        </Row>
      </Pressable>
    </Card>
  );
}

function TodoScreen({ quote, orders, stMap, act }) {
  return (
    <>
      <Quote text={quote} />
      <Text style={s.count}>{orders.length} to deliver</Text>
      {orders.length ? orders.map((o) => <OrderRow key={o.id} o={o} st={stMap[o.id] || newSt()} act={act} />) : (
        <Hero style={{ padding: 14, alignItems: 'center' }}>
          <Text style={s.statB}>All clear</Text><Text style={s.statL}>New orders will show up here.</Text>
        </Hero>
      )}
    </>
  );
}

function DoneScreen({ quote, done }) {
  const total = sum(done.map((d) => d.earn));
  const count = done.filter((d) => !d.returned).length;
  return (
    <>
      <Quote text={quote} />
      <Hero style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}><Text style={s.statB}>{count}</Text><Text style={s.statL}>Delivered today</Text></View>
        <View style={{ alignItems: 'center' }}><Text style={s.statB}>₹{total}</Text><Text style={s.statL}>Earned today</Text></View>
      </Hero>
      {done.map((d) => (
        <Card key={d.id + d.time} style={{ padding: 14 }}>
          <Row><Text style={[s.disp, s.hName]}>{d.name}</Text><Text style={{ fontWeight: '800', color: C.ink }}>₹{d.earn}</Text></Row>
          <Muted>{d.id} · {d.time}</Muted>
          <Row style={{ marginTop: 8 }}>
            <Tag>{d.pay}</Tag>
            {d.returned ? <Text style={[s.badT, { flexShrink: 1 }]}>Returned · {d.reason}</Text> : <Text style={[s.okT, { fontSize: 13 }]}>Verified: {d.otp}</Text>}
          </Row>
          {!!d.photo && <Image source={{ uri: d.photo }} style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }} />}
        </Card>
      ))}
    </>
  );
}

function PerfScreen({ range, setRange, todayEarn, todayCount }) {
  const base = RANGES[range];
  const v = base.live ? [...base.v, todayEarn] : base.v;
  const n = base.live ? [...base.n, todayCount] : base.n;
  const tot = sum(v), cnt = sum(n), avg = cnt ? Math.round(tot / cnt) : 0;
  const mx = Math.max(...v), last = v.length - 1, bi = v.indexOf(mx);
  return (
    <>
      <LinearGradient colors={DG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.seg}>
        {[['day', 'Daily'], ['month', 'Monthly'], ['year', 'Yearly']].map(([k, label]) => (
          <Pressable key={k} onPress={() => setRange(k)} style={[s.segBtn, range === k && { backgroundColor: '#fff' }]}>
            <Text style={{ fontWeight: '700', fontSize: 13.5, color: range === k ? '#0B4A2E' : '#9FD9B8' }}>{label}</Text>
          </Pressable>
        ))}
      </LinearGradient>
      <Hero style={{ padding: 16 }}>
        <Text style={s.sub}>Total earned · {base.t}</Text>
        <Text style={s.big}>{inr(tot)}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={s.mini}><Text style={s.miniB}>{cnt}</Text><Text style={s.miniS}>Deliveries</Text></View>
          <View style={s.mini}><Text style={s.miniB}>{inr(avg)}</Text><Text style={s.miniS}>Avg per order</Text></View>
        </View>
      </Hero>
      <Card style={{ padding: 14 }}>
        <Text style={[s.disp, { fontSize: 15, fontWeight: '700', color: '#0B4A2E', marginBottom: 6 }]}>Earnings by {base.u}</Text>
        <View style={s.chart}>
          {v.map((val, i) => (
            <View key={i} style={s.col}>
              <Text style={s.val}>{short(val)}</Text>
              {i === last ? (
                <LinearGradient colors={['#5EE79F', '#1FA463']} style={[s.bar2, { height: Math.max(4, Math.round((val / mx) * 120)) }]} />
              ) : (
                <LinearGradient colors={['#127A48', '#052116']} style={[s.bar2, { height: Math.max(4, Math.round((val / mx) * 120)) }]} />
              )}
              <Text style={s.lbl}>{base.l[i]}</Text>
            </View>
          ))}
        </View>
        <Muted style={{ textAlign: 'center', marginTop: 8 }}>{base.note}</Muted>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[[inr(mx), `Best ${base.u} (${base.l[bi]})`], [inr(Math.round(tot / v.length)), `Average per ${base.u}`], ['96%', 'On-time deliveries'], ['91%', 'Order acceptance']].map(([b, l]) => (
          <Hero key={l} style={{ width: '48.5%', padding: 14, alignItems: 'center', marginBottom: 4 }}>
            <Text style={s.statB}>{b}</Text><Text style={s.statL}>{l}</Text>
          </Hero>
        ))}
      </View>
    </>
  );
}

function ProfileScreen({ online, goOnline, logout }) {
  return (
    <>
      <Hero style={{ padding: 16 }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={[s.disp, { fontSize: 22, color: '#fff' }]}>Ravi Kumar</Text>
            <Text style={s.sub}>Partner ID DP-20931 · Chennai</Text>
          </View>
          <Tag>★ 4.8</Tag>
        </Row>
      </Hero>
      <Card style={{ padding: 14 }}>
        <Row>
          <View>
            <Text style={{ fontWeight: '700', color: C.ink }}>Available for orders</Text>
            <Muted>{online ? 'You’re online' : 'You’re offline'}</Muted>
          </View>
          <Switch value={online} onValueChange={goOnline} trackColor={{ false: C.line, true: C.ok }} thumbColor="#fff" />
        </Row>
      </Card>
      <Card style={{ padding: 14 }}>
        <Row><Muted>Vehicle</Muted><Text style={s.bold}>Bike · TN 09 AB 1234</Text></Row>
        <Row style={{ marginTop: 8 }}><Muted>Documents</Muted><Text style={s.okT}>Verified</Text></Row>
        <Row style={{ marginTop: 8 }}><Muted>Bank payout</Muted><Text style={s.bold}>••• 4417</Text></Row>
      </Card>
      <Btn label="Call support" style={{ marginBottom: 8 }} onPress={() => call(SUPPORT)} />
      <Btn variant="warn" label="Log out" onPress={logout} />
    </>
  );
}

function SosSheet({ visible, loc, onShare, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.ov}>
        <View style={[s.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <Text style={[s.disp, { fontSize: 24 }]}>Need help?</Text>
          <Muted style={{ marginVertical: 6 }}>Choose what you need. Support can see your active order.</Muted>
          <Btn variant="sos" label="Call emergency services (112)" onPress={() => call('112')} />
          <Btn variant="pri" label="Call VPNexues support" style={{ marginTop: 8 }} onPress={() => call(SUPPORT)} />
          <Btn label="Share live location with support" style={{ marginTop: 8 }} onPress={onShare} />
          <Muted style={{ minHeight: 22, marginVertical: 8 }}>{loc}</Muted>
          <Btn label="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/* ───────── root ───────── */
const TABS = [
  { k: 'todo', label: 'To deliver', Icon: IconBox },
  { k: 'done', label: 'Completed', Icon: IconCheck },
  { k: 'perf', label: 'Performance', Icon: IconChart },
  { k: 'me', label: 'Profile', Icon: IconUser },
];
const TITLES = { todo: 'To deliver', done: 'Completed', perf: 'Performance', me: 'Profile' };

function Root() {
  const insets = useSafeAreaInsets();
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState('todo');
  const [range, setRange] = useState('day');
  const [openId, setOpenId] = useState(null);
  const [online, setOnline] = useState(true);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [done, setDone] = useState(INITIAL_DONE);
  const [stMap, setStMap] = useState({});
  const [sos, setSos] = useState(false);
  const [loc, setLoc] = useState('');
  const [toasts, setToasts] = useState([]);
  const [qi, setQi] = useState(0);

  const onlineRef = useRef(online); onlineRef.current = online;
  const loginRef = useRef(loggedIn); loginRef.current = loggedIn;
  const newSent = useRef(false);
  const scrollRef = useRef(null);
  const scrollY = useRef({ now: 0, list: 0 });
  const tid = useRef(0);

  const toast = useCallback((msg, type = 'success') => {
    const id = ++tid.current;
    setToasts((l) => [...l, { id, msg, type }].slice(-3));
    setTimeout(() => setToasts((l) => l.filter((t) => t.id !== id)), 2800);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setQi((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (loggedIn && !newSent.current) {
      newSent.current = true;
      setTimeout(() => {
        if (!loginRef.current || !onlineRef.current) return;
        setOrders((l) => (l.some((x) => x.id === NEW_ORDER.id) ? l : [...l, NEW_ORDER]));
        toast('New order DX-4824 assigned to you', 'info');
      }, 20000);
    }
  }, [loggedIn, toast]);

  const cur = openId ? orders.find((x) => x.id === openId) : null;
  useEffect(() => { if (openId && !cur) setOpenId(null); }, [openId, cur]);

  const closeDetail = () => {
    setOpenId(null);
    setTimeout(() => scrollRef.current && scrollRef.current.scrollTo({ y: scrollY.current.list, animated: false }), 0);
  };
  useEffect(() => {
    if (!openId) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { closeDetail(); return true; });
    return () => sub.remove();
  }, [openId]);

  const getSt = (id) => stMap[id] || newSt();
  const upd = (id, patch) => setStMap((m) => ({ ...m, [id]: { ...(m[id] || newSt()), ...patch } }));
  const orderOf = (id) => orders.find((x) => x.id === id);

  const act = {
    upd,
    open: (id) => { scrollY.current.list = scrollY.current.now; setOpenId(id); },
    panel: (id, p) => upd(id, { panel: getSt(id).panel === p ? '' : p }),
    attempt: (id, silent) => {
      const a = getSt(id).attempts;
      if (a < 3) {
        upd(id, { attempts: a + 1 });
        toast(a + 1 < 3 ? `Call attempt ${a + 1} of 3 logged` : '3 attempts done. You can call support now', a + 1 < 3 ? 'info' : 'warn');
      }
    },
    supportOk: (id) => { upd(id, { verified: true, bySupport: true }); toast('Support approved the handover', 'info'); },
    verifyPickup: (id) => {
      const o = orderOf(id), s0 = getSt(id);
      if (s0.potp.length < 4) { upd(id, { perr: 'Enter the 4-digit pickup OTP.' }); toast('Enter the 4-digit pickup OTP', 'error'); }
      else if (s0.potp !== o.potp) { upd(id, { perr: 'That OTP doesn’t match. Ask the store staff to check again.' }); toast('Wrong pickup OTP. Ask the store staff to check', 'error'); }
      else { upd(id, { picked: true, perr: '' }); toast('Pickup confirmed. Head to the customer'); }
    },
    verify: (id) => {
      const o = orderOf(id), s0 = getSt(id);
      if (s0.otp.length < 4) { upd(id, { err: 'Enter the 4-digit OTP.' }); toast('Enter the 4-digit OTP', 'error'); }
      else if (s0.otp !== o.otp) { upd(id, { err: 'That OTP doesn’t match. Ask the customer to check their SMS.' }); toast('Wrong OTP. Ask the customer to check their SMS', 'error'); }
      else { upd(id, { verified: true, err: '' }); toast('OTP verified'); }
    },
    photo: async (id) => {
      try {
        let res;
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (cam.granted) {
          res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
        } else {
          res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
        }
        if (!res.canceled && res.assets && res.assets[0]) {
          upd(id, { photo: res.assets[0].uri });
          toast('Photo added');
        }
      } catch (e) {
        toast('Couldn’t open the camera', 'error');
      }
    },
    finish: (id) => {
      const o = orderOf(id), s0 = getSt(id);
      setOrders((l) => l.filter((x) => x.id !== id));
      setDone((d) => [{ id: o.id, name: o.name, time: nowTime(), earn: 55 + Math.round(parseFloat(o.dist) * 6), otp: s0.bySupport ? 'Support approved' : 'OTP', pay: o.pay, photo: s0.photo }, ...d]);
      setOpenId(null);
      toast('Delivered with love. Great job!');
    },
    doReturn: (id) => {
      const o = orderOf(id), s0 = getSt(id);
      if (!s0.reason) { upd(id, { rerr: 'Select a reason first.' }); toast('Select a reason to return the order', 'error'); return; }
      setOrders((l) => l.filter((x) => x.id !== id));
      setDone((d) => [{ id: o.id, name: o.name, time: nowTime(), earn: 0, pay: o.pay, returned: true, reason: s0.reason }, ...d]);
      setOpenId(null);
      toast('Return logged. Take the bags back to the store', 'warn');
    },
  };

  const goOnline = () => {
    const next = !online;
    setOnline(next);
    toast(next ? 'You are online. Orders can reach you now' : 'You are offline. No new orders', next ? 'success' : 'info');
  };

  const shareLoc = async () => {
    setLoc('Getting your location…');
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) { setLoc('Couldn’t read your location. Call support instead.'); return; }
      await Location.getCurrentPositionAsync({});
      setLoc('Location shared with support (demo).');
      toast('Location shared with support (demo)');
    } catch (e) {
      setLoc('Couldn’t read your location. Call support instead.');
    }
  };

  const doLogin = () => { setLoggedIn(true); toast('Welcome back, Ravi'); };
  const logout = () => { setLoggedIn(false); setOpenId(null); setTab('todo'); };

  const quote = QUOTES[qi];
  const todayEarn = sum(done.map((d) => d.earn));
  const todayCount = done.filter((d) => !d.returned).length;

  if (!loggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: C.dark }}>
        <StatusBar style="light" />
        <LoginScreen quote={quote} onLogin={doLogin} toast={toast} />
        <Toasts list={toasts} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="light" />
      <LinearGradient colors={DG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.top, { paddingTop: insets.top + 14 }]}>
        {cur ? (
          <Row style={{ justifyContent: 'flex-start', gap: 12, flex: 1 }}>
            <Pressable style={s.backb} onPress={closeDetail} accessibilityLabel="Back to orders"><IconBack /></Pressable>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.brand}>{cur.id} · {getSt(cur.id).picked ? 'DELIVER' : 'PICK UP'}</Text>
              <Text style={s.topH1} numberOfLines={1}>{cur.name}</Text>
            </View>
          </Row>
        ) : (
          <View>
            <Text style={s.brand}>VPNEXUES</Text>
            <Text style={s.topH1}>{TITLES[tab]}</Text>
          </View>
        )}
        <Row style={{ gap: 8 }}>
          <Pressable style={s.sosb} onPress={() => setSos(true)}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>SOS</Text></Pressable>
          {!cur && (
            <View style={s.pill}>
              <View style={[s.dot, online && { backgroundColor: '#7CFFB2' }]} />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{online ? 'Online' : 'Offline'}</Text>
            </View>
          )}
        </Row>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} onScroll={(e) => { scrollY.current.now = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {cur && <OrderCard key={cur.id} o={cur} st={getSt(cur.id)} act={act} />}
        {!cur && tab === 'todo' && <TodoScreen quote={quote} orders={orders} stMap={stMap} act={act} />}
        {!cur && tab === 'done' && <DoneScreen quote={quote} done={done} />}
        {!cur && tab === 'perf' && <PerfScreen range={range} setRange={setRange} todayEarn={todayEarn} todayCount={todayCount} />}
        {!cur && tab === 'me' && <ProfileScreen online={online} goOnline={goOnline} logout={logout} />}
      </ScrollView>

      {!cur && <LinearGradient colors={GO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.nav, { paddingBottom: insets.bottom }]}>
        {TABS.map(({ k, label, Icon }) => {
          const on = tab === k;
          const col = on ? '#fff' : '#9FD9B8';
          return (
            <Pressable key={k} style={[s.navBtn, on && { borderTopColor: '#5EE79F' }]} onPress={() => setTab(k)}>
              <Icon color={col} />
              <Text style={{ color: col, fontWeight: '600', fontSize: 12.5, marginTop: 3 }}>{label}</Text>
            </Pressable>
          );
        })}
      </LinearGradient>}

      <SosSheet visible={sos} loc={loc} onShare={shareLoc} onClose={() => { setSos(false); setLoc(''); }} />
      <Toasts list={toasts} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

/* ───────── styles ───────── */
const s = StyleSheet.create({
  disp: DISP,
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  muted: { color: C.ink2, fontSize: 13.5 },
  txt: { color: C.ink, fontSize: 15 },
  bold: { fontWeight: '700', color: C.ink },
  okT: { color: C.ok, fontWeight: '700' },
  badT: { color: C.bad, fontWeight: '600', fontSize: 13.5 },
  count: { fontSize: 15, fontWeight: '800', color: '#0B7A44', marginHorizontal: 4, marginBottom: 10 },
  label: { fontWeight: '600', fontSize: 14, color: C.ink, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 2, borderColor: '#8CD1AA', borderRadius: 12, padding: 13, fontSize: 15, color: C.ink, backgroundColor: '#fff' },
  otp: { borderWidth: 2, borderColor: '#8CD1AA', borderRadius: 12, paddingVertical: 10, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 14, color: C.ink, backgroundColor: '#fff' },

  top: { paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topH1: { fontSize: 24, fontWeight: '800', color: '#fff' },
  brand: { fontSize: 12.5, fontWeight: '800', color: '#BFF2D3', letterSpacing: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF8A80', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  sosb: { backgroundColor: C.bad, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },

  nav: { flexDirection: 'row', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  navBtn: { flex: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 10, borderTopWidth: 3, borderTopColor: 'transparent' },

  card: { backgroundColor: C.tint, borderWidth: 1.5, borderColor: C.line, borderLeftWidth: 6, borderLeftColor: C.sign, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  cardHero: { borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  head: { padding: 14, width: '100%' },
  hName: { fontSize: 17, fontWeight: '700', color: '#0B3D27' },
  body: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.line, borderStyle: 'dashed' },
  sec: { marginTop: 14 },
  h3: { fontSize: 14, fontWeight: '700', color: '#0B4A2E', marginBottom: 6 },
  tag: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, backgroundColor: '#C6EBD5', flexShrink: 1 },
  tagTxt: { fontSize: 12.5, fontWeight: '600', color: '#0B5B34' },

  btn: { alignItems: 'center', justifyContent: 'center', padding: 13, borderRadius: 12 },
  btnWrap: { borderRadius: 12, overflow: 'hidden' },
  btnGrad: { alignItems: 'center', justifyContent: 'center', padding: 13 },
  btnTxt: { fontWeight: '700', fontSize: 15, color: '#0B3D27' },

  map: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: C.soft, marginTop: 8 },
  panel: { backgroundColor: '#D3F0DF', borderRadius: 12, padding: 12, marginTop: 8 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.ink2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.ok },
  photo: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#5FC48B', backgroundColor: '#E8F7EE', borderRadius: 12, padding: 16, alignItems: 'center' },
  photoImg: { width: '100%', height: 200, borderRadius: 8, marginTop: 8 },

  quote: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14, overflow: 'hidden' },
  qm: { fontSize: 44, fontWeight: '800', color: '#BFF2D3', alignSelf: 'flex-start', lineHeight: 50 },
  qt: { color: '#fff', fontWeight: '700', fontSize: 16, lineHeight: 21 },
  qs: { marginTop: 4, fontSize: 12, color: '#D6F3E1' },

  mascot: { alignSelf: 'center', marginTop: -14, marginBottom: -13, zIndex: 2 },
  lform: { zIndex: 1, marginHorizontal: 20, marginBottom: 24, padding: 22, backgroundColor: '#fff', borderWidth: 2, borderColor: C.line, borderRadius: 22 },
  backb: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  go: { color: '#0B7A44', fontWeight: '700', fontSize: 13 },
  lhero: { paddingHorizontal: 28, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  bar: { height: 8, width: 72, backgroundColor: '#fff', borderRadius: 4, marginTop: 14, marginBottom: 16 },

  statB: { fontSize: 26, fontWeight: '800', color: '#fff' },
  statL: { fontSize: 13.5, color: '#BFE9D0' },
  sub: { color: '#BFE9D0', fontSize: 13.5 },
  big: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 6, marginBottom: 2 },
  mini: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  miniB: { fontSize: 18, fontWeight: '800', color: '#fff' },
  miniS: { fontSize: 12, color: '#BFE9D0' },

  seg: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 12, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 175, paddingTop: 6 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' },
  bar2: { width: '100%', maxWidth: 46, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  val: { fontSize: 11, fontWeight: '700', color: '#0B4A2E' },
  lbl: { fontSize: 11.5, fontWeight: '600', color: C.ink2 },

  ov: { flex: 1, backgroundColor: 'rgba(5,15,25,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.tint, borderTopWidth: 6, borderTopColor: C.sign, padding: 18, paddingTop: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  toasts: { position: 'absolute', left: 12, right: 12, gap: 8, zIndex: 50, alignSelf: 'center', maxWidth: 406 },
  toast: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  toastI: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
