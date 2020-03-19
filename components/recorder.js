import React, {useEffect, useRef, useState} from 'react';
import {useSafeArea} from 'react-native-safe-area-context';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Button from './button';
import {Colors, GlobalStyles} from '../styles';
import {Fitness, Realm} from '../lib';
import moment from 'moment';
import numeral from 'numeral';

export default function Recorder(props) {
  const {activeWalk} = props;
  const safeAreaInsets = useSafeArea();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());
  const [pause, setPause] = useState(null);
  const isPausedRef = useRef(false);
  const [end, setEnd] = useState(null);
  const isEndedRef = useRef(false);

  useEffect(() => {
    Fitness.startUpdates(data => {
      if (!isEndedRef.current && !isPausedRef.current) {
        setData(data)
      }
    });
    return () => Fitness.stopUpdates();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 500);
    return () => clearInterval(interval);
  }, []);

  const onPause = () => {
    setPause(new Date());
    isPausedRef.current = true;
  };

  const onResume = () => {
    Realm.open().then(realm => {
      realm.write(() => {
        activeWalk.pause = (activeWalk.pause || 0) + moment(now).diff(pause, 'seconds');
        isPausedRef.current = false;
        setPause(null);
      });
    });
  }

  const onStop = () => {
    let end = new Date();
    if (pause) {
      end = pause;
    }
    setEnd(end);
    isEndedRef.current = true;
    Fitness.stopUpdates();
    Fitness.getPedometerData(end).then(pedometerData => setData(data));
  };

  const onFinish = () => {
    if (end) {
      Fitness.stopRecording(end, data);
    }
  }

  let dt = 0, elapsedTime;
  if (activeWalk) {
    let compare = now;
    if (end) {
      compare = end;
    } else if (pause) {
      compare = pause;
    }
    dt = moment(compare).diff(activeWalk.start, 'seconds');
    if (activeWalk.pause) {
      dt -= activeWalk.pause;
    }
  }
  const sec = dt % 60;
  const min = Math.floor(dt / 60);
  elapsedTime = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`

  return (
    <View pointerEvents="box-none" style={[styles.container, props.style]}>
      <View style={styles.header}>
        <Text style={[GlobalStyles.h2, styles.headerText]}>Recording</Text>
      </View>
      <View style={styles.body}>
        <View>
          <Text style={styles.count}>{elapsedTime}</Text>
          <Text style={styles.label}>min</Text>
        </View>
        <View>
          <Text style={styles.count}>{data ? numeral(data.distance * 0.000621371).format('0.0') : '0.0'}</Text>
          <Text style={styles.label}>miles</Text>
        </View>
        <View>
          <Text style={styles.count}>{data ? data.numberOfSteps : 0}</Text>
          <Text style={styles.label}>steps</Text>
        </View>
        <View style={{opacity: end ? 1 : 0}}>
          <Button onPress={onFinish} style={styles.finishButton}>Finish</Button>
        </View>
      </View>
      { !end &&
        <View style={[styles.buttonsContainer, {paddingBottom: safeAreaInsets.bottom}]}>
          <View style={styles.secondaryButtonContainer}>
          </View>
          { pause &&
            <View style={styles.primaryButtonContainer}>
              <TouchableOpacity onPress={onResume}>
                <Image style={styles.primaryButton} source={require('../assets/record.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.resumeText]}>Resume</Text>
            </View>
          }
          { !pause &&
            <View style={styles.primaryButtonContainer}>
              <TouchableOpacity onPress={onStop}>
                <Image style={styles.primaryButton} source={require('../assets/stop.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.recordText]}>Stop & Save</Text>
            </View>
          }
          { pause &&
            <View style={styles.secondaryButtonContainer}>
              <TouchableOpacity onPress={onStop} style={styles.primaryButton}>
                <Image style={styles.secondaryButton} source={require('../assets/stop.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.recordText]}>Stop</Text>
            </View>
          }
          { !pause &&
            <View style={styles.secondaryButtonContainer}>
              <TouchableOpacity onPress={onPause} style={styles.primaryButton}>
                <Image style={styles.secondaryButton} source={require('../assets/pause.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.pauseText]}>Pause</Text>
            </View>
          }
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 16
  },
  header: {
    ...GlobalStyles.boxShadow,
    backgroundColor: Colors.primary.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  headerText: {
    color: 'white',
    marginBottom: 0
  },
  body: {
    ...GlobalStyles.boxShadow,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'white',
    flex: 1,
    marginBottom: 20 + 17 + 8 + 27,
    justifyContent: 'center',
    alignItems: 'center'
  },
  count: {
    fontWeight: 'bold',
    fontSize: 72,
    lineHeight: 72,
    textAlign: 'center',
    color: Colors.primary.purple
  },
  label: {
    textAlign: 'center',
    fontSize: 18,
    color: Colors.primary.purple,
    marginBottom: 20
  },
  finishButton: {
    width: 180
  },
  buttonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 11
  },
  primaryButtonContainer: {
    alignItems: 'center',
    width: 120
  },
  primaryButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 17,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 20
  },
  secondaryButtonContainer: {
    alignItems: 'center',
    width: 80
  },
  secondaryButton: {
    width: 40,
    height: 40
  },
  pauseText: {
    color: Colors.accent.yellow
  },
  recordText: {
    color: Colors.secondary.red,
  },
  resumeText: {
    color: Colors.primary.purple
  }
});
