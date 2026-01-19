# First Time User Detection & Onboarding Workflow

## 📋 Overview (Samajh)

Jab user pehli baar app open karta hai:
1. **System check karta hai** - User registered hai ya nahi
2. **Agar first time user hai** - Onboarding/Guide screen dikhaya jata hai
3. **Onboarding complete hone ke baad** - User ko main app access milta hai

---

## 🔄 Complete Workflow

### Step 1: App Open Hota Hai
- User app open karta hai
- System check karta hai: User logged in hai ya nahi

### Step 2: Authentication Check
- **Agar logged in nahi hai:**
  - Login/Signup screen dikhao
  - User ko login karne do

- **Agar logged in hai:**
  - Next step pe jao

### Step 3: First Time User Check
- Backend API call: `GET /api/auth/check-status`
- Backend check karta hai: `user.onboardingCompleted === false`
- Response:
  ```json
  {
    "success": true,
    "isFirstTime": true,
    "needsOnboarding": true,
    "onboardingCompleted": false,
    "user": {...}
  }
  ```

### Step 4: Onboarding Screen Show Karein
- Agar `needsOnboarding === true`:
  - Onboarding screens dikhao
  - User ko app ka introduction do
  - Step-by-step guide dikhao

### Step 5: Onboarding Complete
- User "Get Started" ya "Skip" button click karta hai
- Backend API call: `POST /api/auth/complete-onboarding`
- Backend update karta hai: `user.onboardingCompleted = true`
- User ko main app dikhao

---

## 🌐 For React/Next.js Developers

### Step 1: Hook Install Karein

Hook already banaya gaya hai: `app/hooks/useFirstTimeUser.ts`

### Step 2: App Component Mein Use Karein

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import { useFirstTimeUser } from './hooks/useFirstTimeUser';
import OnboardingScreen from './components/OnboardingScreen';

function App() {
  const navigate = useNavigate();
  const { 
    isFirstTime, 
    needsOnboarding, 
    loading, 
    checkStatus, 
    completeOnboarding 
  } = useFirstTimeUser();

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Check user status
      checkStatus();
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, []);

  // Show loading while checking
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show onboarding if needed
  if (needsOnboarding) {
    return (
      <OnboardingScreen 
        onComplete={async () => {
          await completeOnboarding();
          navigate('/home');
        }}
      />
    );
  }

  // Show main app
  return <MainApp />;
}
```

### Step 3: Onboarding Component Banayein

```tsx
// components/OnboardingScreen.tsx
import { useState } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to FantaBeach!',
      description: 'Create your fantasy team and compete with others',
      image: '/images/onboarding-1.png'
    },
    {
      title: 'Choose Your Players',
      description: 'Select your favorite players and build your dream team',
      image: '/images/onboarding-2.png'
    },
    {
      title: 'Join Leagues',
      description: 'Compete in public or private leagues',
      image: '/images/onboarding-3.png'
    },
    {
      title: 'Win Prizes',
      description: 'Earn credits and win exciting prizes',
      image: '/images/onboarding-4.png'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <img src={steps[currentStep].image} alt={steps[currentStep].title} />
        <h1>{steps[currentStep].title}</h1>
        <p>{steps[currentStep].description}</p>
      </div>

      <div className="onboarding-actions">
        <button onClick={handleSkip}>Skip</button>
        <button onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>

      <div className="onboarding-indicators">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentStep ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Protected Route Mein Use Karein

```tsx
// components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { useFirstTimeUser } from '../hooks/useFirstTimeUser';
import OnboardingScreen from './OnboardingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { needsOnboarding, loading, checkStatus, completeOnboarding } = useFirstTimeUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    checkStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen 
        onComplete={async () => {
          await completeOnboarding();
        }}
      />
    );
  }

  return <>{children}</>;
}
```

---

## 📱 For Flutter Developers

### Step 1: Service Class Banayein

`lib/services/first_time_user_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FirstTimeUserService {
  final String baseUrl = 'https://fataapp-delta.vercel.app';

  Future<Map<String, dynamic>?> checkUserStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('authToken');

      if (token == null) {
        return {
          'isFirstTime': true,
          'needsOnboarding': true,
          'onboardingCompleted': false,
        };
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/check-status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'isFirstTime': data['isFirstTime'] ?? false,
          'needsOnboarding': data['needsOnboarding'] ?? false,
          'onboardingCompleted': data['onboardingCompleted'] ?? false,
          'user': data['user'],
        };
      } else {
        return {
          'isFirstTime': true,
          'needsOnboarding': true,
          'onboardingCompleted': false,
        };
      }
    } catch (e) {
      print('Error checking user status: $e');
      return {
        'isFirstTime': true,
        'needsOnboarding': true,
        'onboardingCompleted': false,
      };
    }
  }

  Future<bool> completeOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('authToken');

      if (token == null) {
        return false;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/complete-onboarding'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Error completing onboarding: $e');
      return false;
    }
  }
}
```

### Step 2: Main App Mein Use Karein

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/onboarding_screen.dart';
import 'screens/home_screen.dart';
import 'services/first_time_user_service.dart';
import 'services/auth_service.dart';

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
      home: AppInitializer(),
    );
  }
}

class AppInitializer extends StatefulWidget {
  @override
  _AppInitializerState createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  final FirstTimeUserService _firstTimeService = FirstTimeUserService();
  final AuthService _authService = AuthService();
  bool _isLoading = true;
  bool _needsOnboarding = false;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkUserStatus();
  }

  Future<void> _checkUserStatus() async {
    // Check if user is logged in
    final token = await _authService.getToken();
    
    if (token == null) {
      // Not logged in, show login screen
      setState(() {
        _isLoading = false;
        _isAuthenticated = false;
      });
      return;
    }

    // Check onboarding status
    final status = await _firstTimeService.checkUserStatus();
    
    setState(() {
      _isLoading = false;
      _isAuthenticated = true;
      _needsOnboarding = status?['needsOnboarding'] ?? false;
    });
  }

  Future<void> _completeOnboarding() async {
    final success = await _firstTimeService.completeOnboarding();
    if (success) {
      setState(() {
        _needsOnboarding = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!_isAuthenticated) {
      return LoginScreen();
    }

    if (_needsOnboarding) {
      return OnboardingScreen(
        onComplete: _completeOnboarding,
      );
    }

    return HomeScreen();
  }
}
```

### Step 3: Onboarding Screen Banayein

```dart
// lib/screens/onboarding_screen.dart
import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;

  OnboardingScreen({required this.onComplete});

  @override
  _OnboardingScreenState createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Welcome to FantaBeach!',
      description: 'Create your fantasy team and compete with others',
      image: 'assets/onboarding_1.png',
    ),
    OnboardingPage(
      title: 'Choose Your Players',
      description: 'Select your favorite players and build your dream team',
      image: 'assets/onboarding_2.png',
    ),
    OnboardingPage(
      title: 'Join Leagues',
      description: 'Compete in public or private leagues',
      image: 'assets/onboarding_3.png',
    ),
    OnboardingPage(
      title: 'Win Prizes',
      description: 'Earn credits and win exciting prizes',
      image: 'assets/onboarding_4.png',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: widget.onComplete,
                child: Text('Skip'),
              ),
            ),

            // Page view
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _buildPage(_pages[index]);
                },
              ),
            ),

            // Indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pages.length,
                (index) => _buildIndicator(index == _currentPage),
              ),
            ),

            // Next/Get Started button
            Padding(
              padding: EdgeInsets.all(20),
              child: ElevatedButton(
                onPressed: () {
                  if (_currentPage < _pages.length - 1) {
                    _pageController.nextPage(
                      duration: Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  } else {
                    widget.onComplete();
                  }
                },
                child: Text(
                  _currentPage == _pages.length - 1 ? 'Get Started' : 'Next',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(OnboardingPage page) {
    return Padding(
      padding: EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(page.image),
          SizedBox(height: 40),
          Text(
            page.title,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 20),
          Text(
            page.description,
            style: TextStyle(fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildIndicator(bool isActive) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? Colors.blue : Colors.grey,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

class OnboardingPage {
  final String title;
  final String description;
  final String image;

  OnboardingPage({
    required this.title,
    required this.description,
    required this.image,
  });
}
```

---

## 📱 For React Native Developers

### Step 1: Service Function

```javascript
// services/firstTimeUserService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fataapp-delta.vercel.app';

export const checkUserStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      return {
        isFirstTime: true,
        needsOnboarding: true,
        onboardingCompleted: false,
      };
    }

    const response = await fetch(`${BASE_URL}/api/auth/check-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        isFirstTime: data.isFirstTime || false,
        needsOnboarding: data.needsOnboarding || false,
        onboardingCompleted: data.onboardingCompleted || false,
        user: data.user,
      };
    } else {
      return {
        isFirstTime: true,
        needsOnboarding: true,
        onboardingCompleted: false,
      };
    }
  } catch (error) {
    console.error('Error checking user status:', error);
    return {
      isFirstTime: true,
      needsOnboarding: true,
      onboardingCompleted: false,
    };
  }
};

export const completeOnboarding = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      return false;
    }

    const response = await fetch(`${BASE_URL}/api/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }
};
```

### Step 2: App Component

```javascript
// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkUserStatus, completeOnboarding } from './services/firstTimeUserService';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    const status = await checkUserStatus();
    
    setLoading(false);
    setIsAuthenticated(true);
    setNeedsOnboarding(status.needsOnboarding);
  };

  const handleOnboardingComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      setNeedsOnboarding(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (needsOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <HomeScreen />;
}
```

---

## 🔌 Backend API Endpoints

### 1. Check User Status

**Endpoint:** `GET /api/auth/check-status`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "isFirstTime": true,
  "needsOnboarding": true,
  "onboardingCompleted": false,
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "name": "User Name",
    "profilePicture": "https://...",
    "isVerified": true
  }
}
```

### 2. Complete Onboarding

**Endpoint:** `POST /api/auth/complete-onboarding`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "onboardingCompleted": true,
    ...
  }
}
```

---

## ✅ Implementation Checklist

### Backend
- [x] `checkUserStatus` endpoint created
- [x] `completeOnboarding` endpoint created
- [x] `onboardingCompleted` field in User model

### Frontend (React)
- [x] `useFirstTimeUser` hook created
- [ ] OnboardingScreen component
- [ ] App initialization logic
- [ ] Protected route integration

### Frontend (Flutter)
- [x] `FirstTimeUserService` class
- [ ] OnboardingScreen widget
- [ ] App initialization logic

### Frontend (React Native)
- [x] Service functions
- [ ] OnboardingScreen component
- [ ] App initialization logic

---

## 🎯 Key Points

1. **First Time Check:** App open hone pe automatically check hota hai
2. **Onboarding Screen:** Agar `needsOnboarding === true` ho to onboarding dikhao
3. **Complete Onboarding:** User "Get Started" click kare to backend ko call karo
4. **Skip Option:** User skip kar sakta hai, phir bhi onboarding complete mark ho jata hai
5. **One Time Only:** Onboarding sirf ek baar dikhaya jata hai

---

## 🚀 Quick Start

1. **Backend ready hai** - Endpoints already created
2. **React hook ready hai** - `useFirstTimeUser` use karein
3. **Flutter service ready hai** - `FirstTimeUserService` use karein
4. **Onboarding screen banayein** - Apne design ke according
5. **Test karein** - First time user ko onboarding dikhna chahiye

---

**Note:** Yeh complete workflow hai. Step-by-step follow karein aur easily implement kar sakte hain! 🎉

