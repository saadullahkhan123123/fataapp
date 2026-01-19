# Google Sign-In Integration Guide (Google Sign Add)

## 📋 Overview (Samajh)

Yeh guide batata hai ki:
1. **Users kaise Google se login karenge**
2. **Frontend developers kaise integrate karenge** (Flutter, React Native, Web)
3. **Complete flow kaise kaam karta hai**

---

## 🔄 Complete Flow (Kaise Kaam Karta Hai)

### Step 1: User Google Button Click Karta Hai
- User "Sign in with Google" button click karta hai
- Firebase SDK Google Sign-In popup kholta hai

### Step 2: User Google Account Select Karta Hai
- User apna Google account select karta hai
- Google permission deta hai

### Step 3: Firebase ID Token Milta Hai
- Firebase user ko authenticate karta hai
- Firebase ID Token generate hota hai

### Step 4: Frontend Backend Ko Token Bhejta Hai
- Frontend Firebase ID Token ko backend ko bhejta hai
- Endpoint: `POST /api/auth/google`
- Body: `{ "idToken": "firebase_id_token_here" }`

### Step 5: Backend User Ko Authenticate Karta Hai
- Backend Firebase ID Token verify karta hai
- Agar user pehle se nahi hai, to naya user create hota hai
- Agar user pehle se hai, to existing user se link hota hai
- Backend JWT token return karta hai

### Step 6: Frontend JWT Token Store Karta Hai
- Frontend JWT token ko secure storage mein save karta hai
- Ab user logged in hai!

---

## 🌐 For Web Developers (React, Next.js, etc.)

### Step 1: Firebase Install Karein

```bash
npm install firebase
```

### Step 2: Firebase Configuration

`firebase.ts` ya `firebase.js` file banayein:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDIccclSe47Z71Sf0dEnrphzYW6hscJgYA",
  authDomain: "loignfatabeach.firebaseapp.com",
  projectId: "loignfatabeach",
  storageBucket: "loignfatabeach.firebasestorage.app",
  messagingSenderId: "1011142073370",
  appId: "1:1011142073370:android:7f2c05fcb074cc34f1c5a3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Step 3: Google Sign-In Function

```typescript
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const signInWithGoogle = async () => {
  try {
    // Google Sign-In popup kholo
    const result = await signInWithPopup(auth, googleProvider);
    
    // Firebase ID Token lo
    const idToken = await result.user.getIdToken();
    
    // Backend ko token bhejo
    const response = await fetch('https://fataapp-delta.vercel.app/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    if (!response.ok) {
      throw new Error('Google sign-in failed');
    }
    
    const data = await response.json();
    
    // JWT token store karo
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
```

### Step 4: Login Page Mein Button Add Karein

```tsx
import { signInWithGoogle } from './auth';

function LoginPage() {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      // Success! User logged in
      console.log('User:', result.user);
      // Navigate to home page
      window.location.href = '/home';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
    </div>
  );
}
```

---

## 📱 For Flutter Developers

### Step 1: Dependencies Add Karein

`pubspec.yaml` mein add karein:

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  google_sign_in: ^6.1.6
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

### Step 2: Firebase Setup

1. `google-services.json` ko `android/app/` mein copy karein
2. `GoogleService-Info.plist` ko `ios/Runner/` mein copy karein
3. Firebase initialize karein:

```dart
import 'package:firebase_core/firebase_core.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

### Step 3: Google Sign-In Service

`lib/services/auth_service.dart` banayein:

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final String baseUrl = 'https://fataapp-delta.vercel.app';

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // Step 1: Google Sign-In popup
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        // User ne cancel kar diya
        return null;
      }

      // Step 2: Google authentication details lo
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      // Step 3: Firebase credential banao
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Step 4: Firebase se sign in karo
      final UserCredential userCredential = 
          await _auth.signInWithCredential(credential);

      // Step 5: Firebase ID Token lo
      final String? idToken = await userCredential.user?.getIdToken();

      if (idToken == null) {
        throw Exception('Failed to get ID token');
      }

      // Step 6: Backend ko token bhejo
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/google'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'idToken': idToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          // Step 7: JWT token store karo
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('authToken', data['token']);
          await prefs.setString('user', jsonEncode(data['user']));
          
          return {
            'token': data['token'],
            'user': data['user'],
          };
        } else {
          throw Exception(data['message'] ?? 'Sign in failed');
        }
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Sign in failed');
      }
    } catch (e) {
      print('Google Sign-In Error: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _auth.signOut();
      await _googleSignIn.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('authToken');
      await prefs.remove('user');
    } catch (e) {
      print('Sign out error: $e');
      rethrow;
    }
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }
}
```

### Step 4: Login Screen Mein Use Karein

```dart
import 'package:flutter/material.dart';
import 'services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    
    try {
      final result = await _authService.signInWithGoogle();
      
      if (result != null) {
        // Success! Navigate to home
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      // Error show karo
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: _isLoading ? null : _handleGoogleSignIn,
          child: _isLoading 
            ? CircularProgressIndicator()
            : Text('Sign in with Google'),
        ),
      ),
    );
  }
}
```

---

## 📱 For React Native Developers

### Step 1: Dependencies Install Karein

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin
```

### Step 2: Firebase Setup

1. `google-services.json` ko `android/app/` mein copy karein
2. `GoogleService-Info.plist` ko `ios/` mein copy karein
3. Firebase initialize karein

### Step 3: Google Sign-In Function

```javascript
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // Firebase Console se lo
});

export const signInWithGoogle = async () => {
  try {
    // Step 1: Google Sign-In
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    
    // Step 2: Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // Step 3: Firebase se sign in
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    // Step 4: Firebase ID Token lo
    const firebaseIdToken = await userCredential.user.getIdToken();
    
    // Step 5: Backend ko bhejo
    const response = await fetch('https://fataapp-delta.vercel.app/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });
    
    const data = await response.json();
    
    // Step 6: JWT token store karo
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
```

---

## 🔐 Backend API Endpoint

### Endpoint Details

**URL:** `POST https://fataapp-delta.vercel.app/api/auth/google`

**Request Body:**
```json
{
  "idToken": "firebase_id_token_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Signed in with Google successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "name": "User Name",
    "profilePicture": "https://...",
    "isVerified": true,
    "authProvider": "google"
  }
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## 📝 Complete Example (Flutter)

### Full Working Code

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FantaBeach',
      home: LoginScreen(),
    );
  }
}

// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    
    try {
      final result = await _authService.signInWithGoogle();
      
      if (result != null) {
        // Success!
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login successful!')),
        );
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Welcome to FantaBeach'),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _handleGoogleSignIn,
              icon: Icon(Icons.login),
              label: Text('Sign in with Google'),
            ),
            if (_isLoading) CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
```

---

## ✅ Testing Steps

### 1. Firebase Setup Verify Karein
- `google-services.json` (Android) aur `GoogleService-Info.plist` (iOS) files sahi jagah hain
- Firebase project mein Google Sign-In enable hai

### 2. Backend Test Karein
```bash
# Postman ya curl se test karein
curl -X POST https://fataapp-delta.vercel.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test_token"}'
```

### 3. Frontend Test Karein
- Google Sign-In button click karein
- Google account select karein
- Check karein ki JWT token store ho raha hai
- Check karein ki user logged in hai

---

## 🚨 Common Issues & Solutions

### Issue 1: "Google Sign-In Failed"
**Solution:**
- Firebase configuration check karein
- `google-services.json` / `GoogleService-Info.plist` sahi jagah hain
- Firebase Console mein Google Sign-In enable hai

### Issue 2: "Invalid ID Token"
**Solution:**
- Firebase ID Token sahi format mein hai
- Token expire nahi hua
- Backend Firebase Admin SDK sahi configure hai

### Issue 3: "Network Error"
**Solution:**
- Backend URL sahi hai: `https://fataapp-delta.vercel.app`
- Internet connection check karein
- CORS properly configured hai

### Issue 4: "User Already Exists"
**Solution:**
- Yeh normal hai - agar email pehle se hai, to accounts link ho jayengi
- User ko same email se login karne den

---

## 📚 Important Points

1. **Firebase ID Token** - Yeh Firebase se milta hai, backend ko bhejna hota hai
2. **JWT Token** - Yeh backend se milta hai, isko store karna hota hai
3. **Token Storage** - Secure storage use karein (SharedPreferences, AsyncStorage, SecureStorage)
4. **Error Handling** - Har step mein error handling zaroori hai
5. **User State** - Login ke baad user state manage karein

---

## 🔗 Useful Links

- **Backend API:** `https://fataapp-delta.vercel.app`
- **Google Sign-In Endpoint:** `POST /api/auth/google`
- **Firebase Console:** https://console.firebase.google.com
- **Flutter Firebase Docs:** https://firebase.flutter.dev
- **React Native Firebase:** https://rnfirebase.io

---

## 📞 Support

Agar koi issue ho to:
1. Vercel logs check karein
2. Firebase Console check karein
3. Network requests check karein (browser DevTools)
4. Error messages carefully read karein

---

**Note:** Yeh guide complete hai. Step-by-step follow karein aur Google Sign-In easily integrate kar sakte hain! 🚀

