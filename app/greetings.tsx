import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Image,
  Image as RNImage,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // 👈 added
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

type ImageItem = { uri: any; description: string };

export default function GreetingsScreen() {
  const [greeting, setGreeting] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingDescription, setPendingDescription] = useState('');
  const [pendingChangeIndex, setPendingChangeIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [addNewImage, setAddNewImage] = useState(true);

  const rosieImage = require('../assets/images/Rosie.png');
  const rufflesImage = require('../assets/images/Ruffles.png');
  const defaultImageList: ImageItem[] = [
    { uri: rosieImage, description: 'tuxedo cat cartoon in a bow tie' },
    { uri: rufflesImage, description: 'calico cat with bow tie and hand raised' },
  ];

  const [imageList, setImageList] = useState(defaultImageList);
  const viewShotRef = useRef<any>(null);

  const generateAccessibleMessage = () => {
    let message = `Greeting: ${greeting}\n`;
    imageList.forEach((image, index) => {
      message += `Image ${index + 1}: ${image.description}\n`;
    });
    return message.trim();
  };

  const handleAddOrUpdateImage = async (updateIndex: number | null = null) => {
    const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    let permissionGranted = existingPermission.granted;

    if (!permissionGranted) {
      const requestPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      permissionGranted = requestPermission.granted;
    }

    if (!permissionGranted) {
      alert('Permission to access media library is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
      const selectedImageUri = pickerResult.assets[0].uri;
      setPendingImageUri(selectedImageUri);
      setPendingChangeIndex(updateIndex);
      setPendingDescription('');
    }

    setSelectedImage(null);
    setSelectedImageIndex(null);
  };

  const deleteImage = (list: ImageItem[], indexToRemove: number): ImageItem[] =>
    list.filter((_, index) => index !== indexToRemove);

  const handlePress = (action: string) => {
    if (action === 'reset') {
      setGreeting('');
      setImageList(defaultImageList);
    }
    setShowGreeting(!showGreeting);
    setAddNewImage(!addNewImage);
  };

  const renderImage = (uri: any, description: string) => {
    const imageSource = typeof uri === 'string' ? { uri } : uri;
    return (
      <View style={{ alignItems: 'center', marginBottom: 10 }} key={description}>
        <Image
          source={imageSource}
          resizeMode="cover"
          style={styles.imageTile}
          accessibilityLabel={description}
        />
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      </View>
    );
  };

  const shareVisualGreeting = async () => {
    if (viewShotRef.current?.capture) {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { dialogTitle: 'Share visual greeting' });
    }
  };

  useEffect(() => {
    if (pendingImageUri) {
      RNImage.getSize(
        pendingImageUri,
        (width, height) => console.log('🖼️ Image dimensions:', width, height),
        (error) => console.log('❌ Image failed to load:', error)
      );
    }
  }, [pendingImageUri]);

  return (
    <View style={{ flex: 1 }}>
      {/* Hide native header (removes old Back / ☕ buttons) */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Help button – now always visible on this screen */}
      <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 999 }}>
        <Text
          onPress={() => setShowHelp(true)}
          accessibilityRole="button"
          accessibilityLabel="How to use the Greetings page"
          style={{
            backgroundColor: '#222',
            color: 'white',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 12,
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          ?
        </Text>
      </View>

      {!showGreeting ? (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.titleText}>Welcome to Purr Greetings</Text>

          <View style={styles.imageRow}>
            {imageList.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setSelectedImage(item);
                }}
                accessibilityLabel={`Tap to manage image: ${item.description}`}
                accessibilityHint="Opens image options"
              >
                {renderImage(item.uri, item.description)}
              </TouchableOpacity>
            ))}
            {addNewImage && (
              <TouchableOpacity onPress={() => handleAddOrUpdateImage(null)}>
                <View style={styles.addImageBox}>
                  <Text style={{ fontSize: 36, color: '#555' }}>+</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {pendingImageUri && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Image
                key={pendingImageUri}
                source={typeof pendingImageUri === 'string' ? { uri: pendingImageUri } : pendingImageUri}
                resizeMode="cover"
                style={styles.imageTile}
                accessibilityLabel="Pending image preview"
              />
              <TextInput
                style={styles.input}
                value={pendingDescription}
                onChangeText={setPendingDescription}
                placeholder="Enter description for this image"
                placeholderTextColor="gray"
                accessibilityLabel="Image description input"
              />
              <Button
                title={pendingChangeIndex !== null ? 'Update Image' : 'Add Image'}
                onPress={() => {
                  const newImage = {
                    uri: pendingImageUri,
                    description: pendingDescription.trim() || 'No description provided',
                  };
                  if (pendingChangeIndex !== null) {
                    setImageList((prev) => prev.map((img, i) => (i === pendingChangeIndex ? newImage : img)));
                  } else {
                    setImageList((prev) => [...prev, newImage]);
                  }
                  setPendingImageUri(null);
                  setPendingDescription('');
                  setPendingChangeIndex(null);
                  setSelectedImage(null);
                  setSelectedImageIndex(null);
                }}
              />
            </View>
          )}

          <View style={styles.greetingInputSection}>
            <TextInput
              style={styles.input}
              value={greeting}
              onChangeText={setGreeting}
              placeholder="Type a message for Rosie"
              placeholderTextColor="gray"
              accessibilityLabel="Greeting input"
            />
            <View style={styles.buttonContainer}>
              <Button title="Create Message" onPress={() => handlePress('')} accessibilityLabel="Create Message" />
            </View>
          </View>

          {selectedImage !== null && selectedImageIndex !== null && (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.addImageBox}>
                {renderImage(selectedImage.uri, selectedImage.description)}
              </View>
              <View style={styles.buttonRow}>
                <View style={styles.buttonSpacing}>
                  <Button
                    title="Delete"
                    onPress={() => {
                      setImageList(deleteImage(imageList, selectedImageIndex));
                      setSelectedImage(null);
                      setSelectedImageIndex(null);
                    }}
                  />
                </View>
                <View style={styles.buttonSpacing}>
                  <Button title="Change" onPress={() => handleAddOrUpdateImage(selectedImageIndex)} />
                </View>
                <View style={styles.buttonSpacing}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setSelectedImageIndex(null);
                      setSelectedImage(null);
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.previewLabel}>📸 This is what will be shared</Text>

          <ViewShot ref={viewShotRef} style={styles.captureArea}>
            <Text style={styles.titleText}>Welcome to Purr Greetings</Text>
            <Text style={styles.greetingText}>{greeting}</Text>
            <View style={styles.previewImageRow}>
              {imageList.map((item, index) => renderImage(item.uri, item.description))}
            </View>
          </ViewShot>

          <Button
            title="Share Accessible Greeting"
            onPress={() => {
              const textToShare = generateAccessibleMessage();
              Share.share({ message: textToShare, title: 'Share greeting' }).catch((err) =>
                console.log('Sharing failed:', err)
              );
            }}
          />

          <View style={{ marginTop: 10 }}>
            <Button title="Share Visual Greeting" onPress={shareVisualGreeting} />
          </View>
          <View style={{ marginTop: 10 }}>
            <Button
              title="Edit Message"
              onPress={() => setShowGreeting(false)}
              accessibilityLabel="Edit your greeting before sharing"
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <Button
              title="Reset"
              onPress={() => handlePress('reset')}
              accessibilityLabel="Reset greeting and images"
            />
          </View>
        </ScrollView>
      )}

      {/* Help overlay – tap anywhere to close (mobile) */}
      {showHelp && (
        <TouchableWithoutFeedback onPress={() => setShowHelp(false)}>
          <View
            style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              zIndex: 1000,
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                maxWidth: 350,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                How to Use Greetings
              </Text>

              <Text style={{ marginBottom: 8 }}>
                • Type your message into the box.
              </Text>

              <Text style={{ marginBottom: 8 }}>
                • Choose your background or cat image.
              </Text>

              <Text style={{ marginBottom: 8 }}>
                • Press "Create Message" to preview.
              </Text>

              <Text style={{ marginBottom: 8 }}>
                • Use the share buttons to share accessible or visual greetings.
              </Text>

              <Text style={{ marginTop: 12, color: '#555', textAlign: 'center' }}>
                Tap anywhere to close.
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const navStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dcdcdc',
    zIndex: 999,
  },
  bar: {
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  btnActive: { backgroundColor: '#f2f2f2' },
  txt: { fontSize: 15, color: '#333' },
  txtActive: { fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 40,
  },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  imageTile: { width: 150, height: 150, margin: 5, backgroundColor: '#eee' },
  addImageBox: {
    width: 150,
    height: 150,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 5,
  },
  greetingInputSection: { marginTop: 20, alignItems: 'center' },
  titleText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  greetingText: { fontSize: 20, textAlign: 'center', marginVertical: 10 },
  buttonContainer: { marginTop: 20, alignItems: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  buttonSpacing: { marginHorizontal: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
    width: 250,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  captureArea: { backgroundColor: '#fff', padding: 10, marginVertical: 20, width: '90%', borderRadius: 10 },
  previewLabel: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 5 },
  previewImageRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  descriptionBox: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    marginTop: 5,
    maxWidth: 150,
    alignItems: 'center',
  },
  descriptionText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  wrap: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dcdcdc',
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  btnActive: { backgroundColor: '#f2f2f2' },
  txt: { fontSize: 15, color: '#333', maxWidth: 180 },
  txtActive: { fontWeight: '700' },
});
