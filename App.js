import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Vibration, 
  StatusBar, 
  ScrollView,
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Modal,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LineChart, PieChart } from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons'; 
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Constants ---
const { width, height } = Dimensions.get('window');
const IS_SMALL_DEVICE = width < 375;
const CARD_WIDTH = width * 0.92;

const PIE_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#C9CBCF', '#E7E9ED', '#76A346', '#D84315'
];

// --- DAILY PRESETS DATA ---
const DAILY_PRESETS = [
  { name: 'Ya Allah', target: 100 },
  { name: 'Ya Muhammad', target: 100 },
  { name: 'Ya Ali', target: 100 },
  { name: 'Ya Fatema', target: 100 },
  { name: 'Ya Hassan', target: 100 },
  { name: 'Ya Hussain', target: 100 },
  { name: 'SubhanAllah', target: 33 },
  { name: 'Alhamdulillah', target: 33 },
  { name: 'Allahu Akbar', target: 33 },
  { name: 'Astaghfirullah', target: 100 },
  { name: 'La ilaha illallah', target: 100 },
  { name: 'Salawat', target: 100 },
];

const THEMES = {
  neon:   { name: 'Neon Green', bg: '#0F0F0F', card: '#1E1E1E', accent: '#39FF14', text: '#FFFFFF', danger: '#FF453A', accentDim: 'rgba(57, 255, 20, 0.1)', status: 'light-content' },
  ocean:  { name: 'Ocean Blue', bg: '#001219', card: '#002838', accent: '#00D4FF', text: '#E0F7FA', danger: '#FF453A', accentDim: 'rgba(0, 212, 255, 0.1)', status: 'light-content' },
  gold:   { name: 'Royal Gold', bg: '#1A1500', card: '#2E2600', accent: '#FFD700', text: '#FFFBE6', danger: '#FF453A', accentDim: 'rgba(255, 215, 0, 0.1)', status: 'light-content' },
  rose:   { name: 'Hot Rose',   bg: '#1A0006', card: '#2E000F', accent: '#FF006E', text: '#FFE6F0', danger: '#FF453A', accentDim: 'rgba(255, 0, 110, 0.1)', status: 'light-content' },
  light:  { name: 'Day Mode',   bg: '#F2F2F7', card: '#FFFFFF', accent: '#000000', text: '#000000', danger: '#FF3B30', accentDim: 'rgba(0, 0, 0, 0.1)', status: 'dark-content' },
  amoled: { name: 'AMOLED',     bg: '#000000', card: '#121212', accent: '#FFFFFF', text: '#FFFFFF', danger: '#FF453A', accentDim: 'rgba(255, 255, 255, 0.1)', status: 'light-content' },
};

export default function App() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(""); 
  const [history, setHistory] = useState([]); 
  const [tasbihName, setTasbihName] = useState(""); 
  const [dailyTotals, setDailyTotals] = useState({});
  const [currentTheme, setCurrentTheme] = useState('neon'); 
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dailyModalVisible, setDailyModalVisible] = useState(false);

  const colors = THEMES[currentTheme];

  const STORAGE_KEYS = {
    COUNT: '@tasbih_count',
    TARGET: '@tasbih_target',
    HISTORY: '@tasbih_history',
    NAME: '@tasbih_name',
    DAILY: '@tasbih_daily_totals',
    LAST_OPENED: '@tasbih_last_opened',
    THEME: '@tasbih_theme'
  };

  // --- Logic ---
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedCount, savedTarget, savedHistory, savedName, savedDaily, savedLastOpened, savedTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.COUNT),
          AsyncStorage.getItem(STORAGE_KEYS.TARGET),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.NAME),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_OPENED),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
        ]);

        if (savedCount != null) setCount(parseInt(savedCount, 10));
        if (savedTarget != null) setTarget(savedTarget);
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedName) setTasbihName(savedName);
        if (savedDaily) setDailyTotals(JSON.parse(savedDaily));
        if (savedTheme && THEMES[savedTheme]) setCurrentTheme(savedTheme);
        
        if (savedLastOpened) {
          const todayKey = (new Date()).toISOString().slice(0,10);
          if (savedLastOpened !== todayKey) setCount(0);
        }
      } catch (e) { console.warn('Failed to load saved state', e); }
    };
    loadState();
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.COUNT, String(count)).catch(() => {}); }, [count]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.TARGET, String(target)).catch(() => {}); }, [target]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)).catch(() => {}); }, [history]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(dailyTotals)).catch(() => {}); }, [dailyTotals]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.THEME, currentTheme).catch(() => {}); }, [currentTheme]);
  useEffect(() => { 
    AsyncStorage.setItem(STORAGE_KEYS.NAME, tasbihName).catch(() => {}); 
    const todayKey = (new Date()).toISOString().slice(0,10);
    AsyncStorage.setItem(STORAGE_KEYS.LAST_OPENED, todayKey).catch(() => {});
  }, [tasbihName]);

  const handleCount = () => { 
    const newCount = count + 1;
    setCount(newCount);
    
    // Check Target
    const targetNum = parseInt(target);
    if (targetNum && newCount === targetNum) {
      Vibration.vibrate([0, 500, 200, 500]); 
      Alert.alert("Target Reached!", `You have completed ${targetNum} counts.`);
    } else {
      Vibration.vibrate(50); 
    }
  };

  const handleReset = () => {
    if (count > 0) {
      const recordName = tasbihName.trim() === "" ? "Untitled" : tasbihName;
      const record = { name: recordName, count: count, date: (new Date()).toISOString().slice(0,10) };
      setHistory([{ ...record }, ...history]); 
      addToToday(count);
    }
    setCount(0);
    Vibration.vibrate(100);
  };

  const addToToday = (amount) => {
    const key = (new Date()).toISOString().slice(0,10);
    setDailyTotals(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }));
  };

  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all records?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setHistory([]); setDailyTotals({}); }}
    ]);
  };

  const exportCSV = async () => {
    try {
      if (history.length === 0) { 
        Alert.alert('Export', 'No history data to export'); 
        return; 
      }

      const lines = ['Tasbih Name,Date,Count'];

      history.forEach(item => {
        const safeName = item.name ? item.name.replace(/,/g, '') : 'Untitled'; 
        lines.push(`${safeName},${item.date},${item.count}`);
      });

      const csv = lines.join('\n');
      const filename = `tasbih_history_${(new Date()).toISOString().slice(0,10)}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Share History CSV' });
      }
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const applyPreset = (preset) => {
    setTasbihName(preset.name);
    setTarget(String(preset.target));
    setCount(0);
    setDailyModalVisible(false);
    Vibration.vibrate(50);
  };

  // --- Graph Helpers ---
  const prepareChartData = () => {
    const labels = [];
    const dataPoints = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        labels.push(daysOfWeek[d.getDay()]);
        dataPoints.push(dailyTotals[key] || 0);
    }
    return { labels, datasets: [{ data: dataPoints, color: (opacity = 1) => colors.accent, strokeWidth: 3 }] };
  };

  const preparePieData = () => {
    const counts = {};
    history.forEach(item => {
      const name = item.name || 'Untitled';
      counts[name] = (counts[name] || 0) + item.count;
    });
    return Object.keys(counts).map((name, index) => ({
      name: name,
      population: counts[name],
      color: PIE_COLORS[index % PIE_COLORS.length],
      legendFontColor: currentTheme === 'light' ? '#333' : '#FFF',
      legendFontSize: 12
    }));
  };

  // --- Modals ---
  const MenuModal = () => (
    <Modal animationType="fade" transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
        <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.accent, shadowColor: colors.text }]}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>MENU</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentTheme === 'light' ? '#eee' : '#333' }]} onPress={() => { setMenuVisible(false); setDailyModalVisible(true); }}>
            <Ionicons name="list" size={24} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Daily Tasbih Presets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentTheme === 'light' ? '#eee' : '#333' }]} onPress={() => { setMenuVisible(false); setAnalysisVisible(true); }}>
            <Ionicons name="stats-chart" size={24} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Analytics & Graphs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentTheme === 'light' ? '#eee' : '#333' }]} onPress={() => { setMenuVisible(false); setSettingsVisible(true); }}>
            <Ionicons name="settings-sharp" size={24} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Settings & Themes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentTheme === 'light' ? '#eee' : '#333' }]} onPress={() => { setMenuVisible(false); exportCSV(); }}>
            <Ionicons name="share-social" size={24} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Export Data (CSV)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setMenuVisible(false)}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
            <Text style={[styles.menuText, { color: colors.danger }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const DailyTasbihModal = () => (
    <Modal animationType="slide" visible={dailyModalVisible} onRequestClose={() => setDailyModalVisible(false)}>
      <View style={[styles.fullScreenModal, { backgroundColor: colors.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Daily Presets</Text>
          <TouchableOpacity onPress={() => setDailyModalVisible(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: currentTheme === 'light' ? '#666' : '#AAA', marginBottom: 20, textAlign: 'center' }}>
            Select a tasbih to automatically set the name and target.
          </Text>
          
          {DAILY_PRESETS.map((preset, index) => (
             <TouchableOpacity 
               key={index} 
               style={[styles.presetItem, { backgroundColor: colors.card, borderLeftColor: colors.accent }]}
               onPress={() => applyPreset(preset)}
             >
                <View>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{preset.name}</Text>
                  <Text style={{ color: currentTheme === 'light' ? '#666' : '#888', fontSize: 12 }}>Target: {preset.target}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.accent} />
             </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const AnalysisModal = () => (
    <Modal animationType="slide" visible={analysisVisible} onRequestClose={() => setAnalysisVisible(false)}>
      <View style={[styles.fullScreenModal, { backgroundColor: colors.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Analytics</Text>
          <TouchableOpacity onPress={() => setAnalysisVisible(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
           <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
              <Text style={[styles.sectionTitle, { color: currentTheme === 'light' ? '#666' : '#888' }]}>Weekly Trend</Text>
              <LineChart
                data={prepareChartData()}
                width={CARD_WIDTH - 30}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.text,
                  labelColor: (opacity = 1) => currentTheme === 'light' ? '#666' : '#888',
                  propsForDots: { r: "5", strokeWidth: "2", stroke: colors.accent }
                }}
                bezier
                style={{ borderRadius: 16 }}
              />
           </View>
           <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: currentTheme === 'light' ? '#666' : '#888' }]}>Tasbih Breakdown</Text>
              {history.length > 0 ? (
                <PieChart
                  data={preparePieData()}
                  width={CARD_WIDTH - 30}
                  height={220}
                  chartConfig={{ color: (opacity = 1) => colors.text }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute 
                />
              ) : (
                <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>No data to analyze yet.</Text>
              )}
           </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const SettingsModal = () => (
    <Modal animationType="slide" visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
      <View style={[styles.fullScreenModal, { backgroundColor: colors.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={[styles.settingHeader, { color: colors.accent }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text, marginBottom: 15 }}>Select Theme</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {Object.keys(THEMES).map((key) => (
                <TouchableOpacity 
                  key={key} 
                  onPress={() => setCurrentTheme(key)}
                  style={[
                    styles.themeCircle, 
                    { backgroundColor: THEMES[key].bg, borderColor: THEMES[key].accent, borderWidth: 1 },
                    currentTheme === key && { borderWidth: 4, borderColor: THEMES[key].accent }
                  ]}
                >
                   <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: THEMES[key].accent }} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: currentTheme === 'light' ? '#666' : '#888', marginTop: 15, textAlign: 'center', fontWeight: 'bold' }}>{colors.name}</Text>
          </View>
          <Text style={[styles.settingHeader, { color: colors.accent, marginTop: 20 }]}>DATA MANAGEMENT</Text>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card }]} onPress={exportCSV}>
             <Text style={{ color: colors.text, fontSize: 16 }}>Export as CSV</Text>
             <Ionicons name="download-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card }]} onPress={clearHistory}>
             <Text style={{ color: colors.danger, fontSize: 16 }}>Clear All History</Text>
             <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: currentTheme === 'light' ? '#666' : '#666' }}>My Tasbih Pro v1.6</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>Design by Iliyas Abbasali Bohari</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.status} backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        
        <MenuModal />
        <DailyTasbihModal />
        <AnalysisModal />
        <SettingsModal />

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>DIGITAL TASBIH</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Combined Input Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={{ color: currentTheme === 'light' ? '#999' : '#666', fontSize: 12, marginBottom: 5, marginLeft: 5 }}>TASBIH NAME</Text>
            <TextInput 
              style={[styles.inputBox, { color: colors.text, borderBottomWidth: 1, borderBottomColor: currentTheme === 'light' ? '#eee' : '#333', marginBottom: 15 }]} 
              placeholder="e.g. SubhanAllah" 
              placeholderTextColor={currentTheme === 'light' ? '#BBB' : '#555'}
              value={tasbihName} 
              onChangeText={setTasbihName} 
            />
            
            <Text style={{ color: currentTheme === 'light' ? '#999' : '#666', fontSize: 12, marginBottom: 5, marginLeft: 5 }}>TARGET COUNT (Optional)</Text>
            <TextInput 
              style={[styles.inputBox, { color: colors.accent }]} 
              placeholder="e.g. 33, 100" 
              placeholderTextColor={currentTheme === 'light' ? '#BBB' : '#555'}
              value={target} 
              onChangeText={setTarget} 
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.displayScreen, { backgroundColor: colors.card, borderColor: currentTheme === 'light' ? '#DDD' : '#333' }]}>
            <Text style={[styles.counterLabel, { color: currentTheme === 'light' ? '#999' : '#888' }]}>COUNT</Text>
            <Text style={[styles.counterText, { color: colors.accent, textShadowColor: colors.accentDim }]}>
              {count}
            </Text>
            {target !== "" && (
              <Text style={{ color: currentTheme === 'light' ? '#999' : '#666', fontSize: 14, marginTop: 5 }}>
                Target: {target}
              </Text>
            )}
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={[styles.mainButton, { borderColor: currentTheme === 'light' ? '#E5E5E5' : '#222', backgroundColor: currentTheme === 'light' ? '#F5F5F5' : '#151515' }]} onPress={handleCount} activeOpacity={0.7}>
              <View style={[styles.mainButtonInner, { backgroundColor: colors.card, borderColor: currentTheme === 'light' ? '#DDD' : '#333' }]} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetButton, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]} onPress={handleReset}>
              <Text style={[styles.resetText, { color: colors.danger }]}>SAVE & RESET</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContainer}>
             <Text style={[styles.sectionTitle, { color: currentTheme === 'light' ? '#666' : '#888' }]}>Last 30 Days</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
               {Array.from({length:30}).map((_,i) => {
                 const d = new Date(); d.setDate(d.getDate() - (29 - i));
                 const key = d.toISOString().slice(0,10);
                 const total = dailyTotals[key] || 0;
                 const isToday = key === (new Date()).toISOString().slice(0,10);
                 return (
                   <View key={key} style={[
                     styles.dayBox, 
                     { backgroundColor: colors.card },
                     isToday && { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent }
                   ]}>
                     <Text style={[styles.dayText, { color: isToday && currentTheme !== 'light' ? colors.text : (isToday && currentTheme === 'light' ? colors.accent : (currentTheme === 'light' ? '#666' : '#888')) }]}>{d.getDate()}</Text>
                     <Text style={[styles.dayCount, { color: colors.accent }]}>{total}</Text>
                   </View>
                 );
               })}
             </ScrollView>
          </View>

          {/*<View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: currentTheme === 'light' ? '#666' : '#888' }]}>Recent History</Text>
            <View style={[styles.cardNoPadding, { backgroundColor: colors.card }]}>
              {history.length === 0 ? <Text style={styles.emptyText}>No records yet.</Text> : 
                history.slice(0, 5).map((item, index) => (
                  <View key={index} style={[styles.historyItem, { borderBottomColor: currentTheme === 'light' ? '#eee' : '#333' }]}>
                    <View style={styles.historyLeft}>
                      <Text style={[styles.historyLabel, { color: colors.text }]}>{item.name}</Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    <Text style={[styles.historyValue, { color: colors.accent }]}>{item.count}</Text>
                  </View>
                ))
              }
              {history.length > 5 && (
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                  <Text style={{ color: currentTheme === 'light' ? '#666' : '#888', textAlign: 'center', padding: 15, fontSize: 12 }}>View all in Menu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>*/}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  // FIXED: No flexGrow, added small padding to prevent excess bouncing
  scrollContent: { flexGrow: 0, paddingBottom: 20, alignItems: 'center' },
  // FIXED: Reduced marginTop for less gap
  header: { width: CARD_WIDTH, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  iconBtn: { padding: 10, borderRadius: 12 },
  card: { width: CARD_WIDTH, borderRadius: 20, padding: 15, marginBottom: 15 },
  cardNoPadding: { width: CARD_WIDTH, borderRadius: 20, marginBottom: 15, overflow: 'hidden' },
  inputBox: { fontSize: 18, fontWeight: '500', padding: 5 },
  displayScreen: { width: CARD_WIDTH, height: height * 0.18, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  counterLabel: { fontSize: 12, letterSpacing: 2, position: 'absolute', top: 15, right: 20 },
  counterText: { fontSize: IS_SMALL_DEVICE ? 60 : 90, fontWeight: 'bold', fontVariant: ['tabular-nums'], textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  controlsContainer: { alignItems: 'center', marginBottom: 30 },
  mainButton: { width: width * 0.55, height: width * 0.55, maxWidth: 240, maxHeight: 240, borderRadius: 1000, borderWidth: 8, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  mainButtonInner: { width: '90%', height: '90%', borderRadius: 1000, borderWidth: 2 },
  resetButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30 },
  resetText: { fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  sectionContainer: { marginBottom: 20, alignItems: 'center' },
  sectionTitle: { width: CARD_WIDTH, fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  calendarScroll: { paddingHorizontal: (width - CARD_WIDTH) / 2, paddingRight: 20 },
  dayBox: { width: (width / 7) - 10, height: 60, borderRadius: 12, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 16, fontWeight: '600' },
  dayCount: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
  historyLeft: { flex: 1 },
  historyLabel: { fontSize: 16, fontWeight: '600' },
  historyDate: { color: '#888', fontSize: 12, marginTop: 4 },
  historyValue: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#888', padding: 20, textAlign: 'center', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { width: '80%', borderRadius: 20, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  menuTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', letterSpacing: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  menuText: { fontSize: 18, fontWeight: '600', marginLeft: 15 },
  fullScreenModal: { flex: 1, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  modalTitle: { fontSize: 28, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  settingHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10, marginLeft: 5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10 },
  themeCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  presetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginBottom: 10, borderRadius: 12, borderLeftWidth: 4 }
});