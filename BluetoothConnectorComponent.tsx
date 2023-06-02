import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  NativeEventEmitter,
  NativeModules,
  Button,
  StyleSheet,
} from 'react-native';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  Peripheral,
} from 'react-native-ble-manager';
import {request, PERMISSIONS} from 'react-native-permissions';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

export default function BluetoothConnectorComponent({setCurrentMoistureLevel}) {
  const [devices, setDevices] = useState(new Map());
  const [connectedDevice, setConnectedDevice] = useState<Peripheral>();
  const [scanning, setScanning] = useState(false);
  const [home, setHome] = useState(true);

  const [data, setData] = useState(null);

  const getPermission1 = async () => {
    if (Platform.OS === 'android') {
      const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      return status === 'granted';
    }
    return true;
  };

  const getPermission2 = async () => {
    if (Platform.OS === 'android') {
      const bleStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
      console.log('bleStatus', bleStatus);
      return bleStatus === 'granted';
    }
    return true;
  };

  const getPermission3 = async () => {
    if (Platform.OS === 'android') {
      const bleStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
      console.log('bleStatus', bleStatus);
      return bleStatus === 'granted';
    }
    return true;
  };

  const startScan = async () => {
    const permission1 = await getPermission1();
    const permission2 = await getPermission2();
    const permission3 = await getPermission3();
    if (!permission1 && !permission2 && !permission3) {
      console.log('Location permission is required to scan for BLE devices.');
      return;
    }

    // setDevices([]);
    setScanning(true);
    setHome(false); // Add this line

    BleManager.scan([], 1, true)
      .then(() => {
        console.log('Scanning started');
      })
      .catch(error => {
        console.log(error);
      });

    setTimeout(() => {
      BleManager.stopScan()
        .then(() => {
          console.log('Scanning stopped');
          setScanning(false);
        })
        .catch(error => {
          console.log(error);
        });
    }, 60000);
  };

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent,
  ) => {
    setCurrentMoistureLevel(data.value[0]);
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
    );
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    let peripheral = devices.get(event.peripheral);
    if (peripheral) {
      console.debug(
        `[handleDisconnectedPeripheral][${peripheral.id}] previously connected peripheral is disconnected.`,
        event.peripheral,
      );
      setDevices(
        prevDevices => new Map(prevDevices.set(peripheral.id, peripheral)),
      );
    }
    console.debug(
      `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
    );
  };

  const handleStopScan = () => {
    setScanning(false);
    console.debug('[handleStopScan] scan is stopped.');
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    setDevices(
      prevDevices => new Map(prevDevices.set(peripheral.id, peripheral)),
    );
  };

  useEffect(() => {
    BleManager.start({showAlert: false}).then(() => {
      console.log('BleManager initialized');
    });

    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ),
    ];

    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
  }, []);

  const handleConnect = async (item: Peripheral) => {
    BleManager.connect(item.id)
      .then(() => {
        // Success code
        setConnectedDevice(item);
      })
      .catch(error => {
        // Failure code
        console.log(error);
      });

    // Before startNotification you need to call retrieveServices
    await BleManager.retrieveServices(item.id);
    // To enable BleManagerDidUpdateValueForCharacteristic listener
    await BleManager.startNotification(
      item.id,
      '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
      'beb5483e-36e1-4688-b7f5-ea07361b26a8',
    );
  };

  const handleDisconnect = (id: string) => {
    BleManager.disconnect(id)
      .then(() => {
        console.log('Disconnected from ', id);
        setConnectedDevice(undefined);
      })
      .catch(error => {
        console.log(error);
      });
  };

  const renderItem = ({item}: {item: Peripheral}) => {
    const buttonTitle: string = `Connect to ${item.name || 'Unnamed Device'}  ${
      item.id
    }`;
    return (
      <View style={styles.connectButton}>
        <Button onPress={() => handleConnect(item)} title={buttonTitle} />
      </View>
    );
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {home ? (
        <Button title="Search for devices" onPress={startScan} />
      ) : (
        <>
          <TouchableOpacity onPress={() => setHome(true)}>
            <Text style={{fontSize: 20}}>Back</Text>
          </TouchableOpacity>
          <Text style={{fontSize: 16}}>Connected Devices:</Text>
          <Text>{connectedDevice?.name}</Text>
          <Text>
            {connectedDevice ? (
              <Button
                onPress={() => handleDisconnect(connectedDevice.id)}
                title={'Disconnect'}
              />
            ) : (
              'No Device connected'
            )}
          </Text>
          <Text style={{fontSize: 16}}>
            {scanning ? 'Scanning...' : 'Devices found:'}
          </Text>
          <FlatList
            data={Array.from(devices.values())}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={{width: '100%'}}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    margin: 12,
  },
});
