/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';

import {
  Button,
  Image,
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BluetoothConnectorComponent from './BluetoothConnectorComponent';

const API_KEY = 'sk-BsdM6477e6528ccae1123';

function App(): JSX.Element {
  const [view, setView] = useState('HOME');
  const [searchTerm, setSearchTerm] = useState('');
  const [plantData, setPlantData] = useState(null);
  const [currentMoistureLevel, setCurrentMoistureLevel] = useState(0);

  const handleChangeView = () => {
    setView('ADD_PLANT');
  };

  const handleSavePlant = () => {
    setView('HOME');
  };

  const findPlantInfo = async () => {
    console.log('in find plant info');
    try {
      const response = await fetch(
        `https://perenual.com/api/species-list?page=1&key=${API_KEY}&q=${searchTerm}`,
      );
      const responseJson: any = await response.json();
      console.log('responseJson.data[0]', responseJson.data[0]);
      setPlantData(responseJson.data[0]);
    } catch (error: any) {
      console.log('error', error.message);
    }
  };

  const setMoistureLevel = (level: string) => {
    console.log('level', level);
  };

  const savePlant = () => {
    console.log('Save plant');
  };

  const showMoistureLevel = () => {
    let description: string;
    if (currentMoistureLevel >= 190) {
      description = 'low';
    } else if (currentMoistureLevel < 190 && currentMoistureLevel >= 160) {
      description = 'medium';
    } else if (currentMoistureLevel < 160 && currentMoistureLevel >= 140) {
      description = 'high';
    } else {
      description = 'Cannot Read';
    }

    return description;
  };

  return (
    <SafeAreaView>
      <StatusBar barStyle={'light-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text style={styles.appHeading}>Plant App</Text>
          {view === 'HOME' && (
            <View>
              {/* <Button title="Add Plant +" onPress={handleChangeView} /> */}
              <BluetoothConnectorComponent
                setCurrentMoistureLevel={setCurrentMoistureLevel}
              />
              <View style={styles.currentMoistureLevel}>
                <Text>Current moisture level: {showMoistureLevel()}</Text>
              </View>

              <TextInput
                style={styles.input}
                onChangeText={setSearchTerm}
                value={searchTerm}
                placeholder="Enter a search term to find plant info"
              />

              <View style={{width: 200, alignSelf: 'center'}}>
                <Button
                  onPress={findPlantInfo}
                  title="Search for plant info"
                  color="#841584"
                />
              </View>

              {plantData && (
                <View style={styles.plantInfo}>
                  <Text style={styles.plantInfoText}>
                    {plantData.common_name}
                  </Text>
                  <Text style={styles.plantInfoText}>
                    Watering: {plantData.watering}
                  </Text>
                </View>
              )}
            </View>
          )}
          {view === 'ADD_PLANT' && (
            <View>
              <Button title="Hello World!" onPress={handleSavePlant} />
              <TextInput
                style={styles.input}
                onChangeText={setSearchTerm}
                value={searchTerm}
              />
              <Button onPress={findPlantInfo} title="Search for plant info" />
              {plantData && (
                <View>
                  <Text>{plantData.common_name}</Text>
                  <Text>-Watering: {plantData.watering}</Text>
                </View>
              )}
              <Text>Alert when moisture level is:</Text>
              <Button
                onPress={() => setMoistureLevel('High')}
                title="High"
                color="#841584"
              />
              <Button
                onPress={() => setMoistureLevel('Medium')}
                title="Medium"
                color="#841584"
              />
              <Button
                onPress={() => setMoistureLevel('Low')}
                title="Low"
                color="#841584"
              />
              <Button onPress={savePlant} title="Save Plant" color="#841584" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appHeading: {
    padding: 24,
    fontSize: 24,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: 280,
    alignSelf: 'center',
  },
  searchButton: {},
  currentMoistureLevel: {
    alignItems: 'center',
    padding: 24,
    margin: 10,
    borderWidth: 4,
    borderColor: '#841584',
  },
  plantInfo: {
    alignItems: 'center',
    padding: 12,
  },
  plantInfoText: {
    fontSize: 18,
  },
});

export default App;
