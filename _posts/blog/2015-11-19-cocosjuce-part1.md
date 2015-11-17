---
title: "Consuming a headless Juce C++ audio library from a Xamarin CocosSharp game UI - Part 1"
bg: grey
color: black
date: 2015-11-19 08:00:01
group: blog
type: blogpost
layout: blogpost
author: Leo Olivers
---

*Sample code for this article is available at [github.com/altalogix/CocosJuce](http://github.com/altalogix/CocosJuce).*

*A summary of this article series is available as [slides](/doc/2015-11-19-cocosjuce/jucesummit-cocosjuce.pdf), presented at the [Juce Summit 2015](http://www.juce.com/summit).*

I have been a longtime enthusiastic user of the [Juce](http://www.juce.com) C++ framework, with several audio [plugins](/#tonespace) based on it.
At the same time I have been venturing into some mobile projects lately, mostly using [Xamarin](http://www.xamarin.com). 
Which is a great toolset as well, allowing me to write cross-platform mobile apps in C# and leveraging experience I built over the years while doing enterprise .NET projects. 
An interesting extension to the Xamarin platform is the [CocosSharp](https://github.com/mono/CocosSharp/wiki) 2D gaming framework. This is Xamarin's fork of Cocos-2d-XNA, itself a port of the hugely popular Cocos-2d family.

So, inevitably I arrived at a point where I wanted to combine both. That is, write the UI in C# in Xamarin/CocosSharp but still use the powerful C++ audio facilities supplied by Juce. CocosSharp itself only contains a very basic audio engine, sufficient for simple playback of audio files for game effects.  I was however looking for a way to generate procedural audio, preferably via some MIDI-driven synthesizer/sequencing engine - which is far beyond the reach of CocosSharp.  And having written exactly such code before -using Juce of course- I naturally wanted to reuse that codebase as much as possible.
That's were things got interesting.

<a href="/img/2015-11-19-cocosjuce/cocosjuce.png" class="swipebox" title="cocosjuce">
<img src="/img/2015-11-19-cocosjuce/cocosjuce.png" alt="cocosjuce"  width="200"></a>

Alternatively, I could have opted to use Juce's built-in support for coding mobile UIs. But, while doing mobile OpenGL in Juce is certainly possible as well, to my knowledge this requires much more low-level coding and you cannot do it in C# of course.
The attractive part of CocosSharp is its simple and fast C# gaming abstraction layer it places on top of OpenGL. Plus a rich ecosystem of animation and other game asset editor tools that support the Cocos-2d family. Both are viable choices, but here we'll explore the Xamarin C# approach.

So I had to find a way to marry Juce with CocosSharp, with Juce providing a headless audio library and CocosSharp providing the UI. Such a way was found indeed and the remainder of this post demonstrates the technique with a basic sample.  

*Caveat: while everything seems to work fine so far, at the moment of this writing no app that uses this technique has yet been submitted to the iOS or Android app stores. Once that has happened I'll update this post with feedback if necessary.*

## Designing the headless audio library

Building a Juce audio lib is quite straightforward. To keep things as simple a possible, our `CocosJuce` sample creates about the most basic of sound-producing objects Juce can provide: the [`ToneGeneratorAudioSource`](http://learn.juce.com/doc/classToneGeneratorAudioSource.php). This is a rudimentary frequency generator, allowing us to choose a frequency and an amplitude. The ToneGeneratorAudiosource is then wrapped in a Juce [`AudioSourcePlayer`](http://learn.juce.com/doc/classAudioSourcePlayer.php), which in turn acts as the callback for the Juce [`AudioDeviceManager`](http://learn.juce.com/doc/classAudioDeviceManager.php). Simply wire them all up together and our test tone sounds. This should give you a taste of how easy it is to work with audio in Juce.

Here's a picture of the design:

<a href="/img/2015-11-19-cocosjuce/audiolibdesign.png" class="swipebox" title="audio lib design">
<img src="/img/2015-11-19-cocosjuce/audiolibdesign.png" alt="audiolibdesign"  width="800"></a>

The `CocosJuceMain` class is the only custom class in the design and acts as a very simple entry point for our library, holding references to the various Juce objects we just mentioned. It naturally offers a method for starting and stopping the test tone sound, along with a few methods for lifecycle management that make sense on mobile platforms, such as suspending/resuming audio and cleaning stuff up. Initialization is lazy though via the static current() method, so no initialization method is needed.  And at the risk of stating the obvious: no Juce UI classes are being used here as this would defeat the purpose of building a headless lib.

So far so good, but alas this is not sufficient.  CocosJuceMain is a C++ class which we cannot instantiate or call directly from C# in Xamarin.  What we need is a set of pure, static C interface methods on top of this, that *are* callable from C#. 
It is these C methods that will be exported by our library for usage by external consumers. Everything else remains a black box to the library consumer.

##### Side note : A real world version
in  a real-world audio project you would probably consider writing your sound-generating class as a derivative of Juce's [`AudioProcessor`](http://learn.juce.com/doc/classAudioProcessor.php) class.  
That's a very powerful base class which implements a lot of the plumbing needed for classic DAW plugins, such as VSTs and AudioUnits.  While a VST or AU is not needed in this mobile scenario, the abstraction level provided by AudioProcessor would still
match nicely the APIs needed for most audio libraries. An AudioProcessor for instance accepts MIDI input, produces audio output, and has a very practical little parameter system.
You would then host the AudioProcessor within a Juce [`AudioProcessorPlayer`](http://learn.juce.com/doc/classAudioProcessorPlayer.php), which acts as callback to the AudioDeviceManager we already mentioned.  Then expose part of AudioProcessor's API via pure C functions and you are good to go.  In fact, a VST dll, which Juce can produce, is almost exactly that!

## Coding the headless audio library

Now let's code our library. For this we'll reach for the magnificent *IntroJucer* tool that comes with the Juce framework.  The great thing about IntroJucer is that it allows you to define project and build configurations once in a platform-independent way (stored in a .jucer file), and then generates all the platform-specific files for you, such as XCode iOS projects and Android make files. Btw, I have used Juce v3.3.0 for this sample.

One thing you need to know is that Android and iOS differ in how they support linking to native libraries in Xamarin.  On iOS we need to supply a static (.a) lib, since Apple does not allow deploying your own shared (.dylib) libs.  On Android it's the reverse (at least when using Xamarin) : there we *do* need to supply a shared lib (.so).  This fact causes a minor annoyance: since IntroJucer supports only a single library type per .jucer file, we'll need to create two separate IntroJucer projects: one with a static lib for iOS and another with a dynamic lib for Android. Fortunately we can share our C++ code across these two projects though.

##### IntroJucer settings

I will not explain here all the intricacies of how to use the IntroJucer here. It's not hard though and a tutorial can be found [here](http://learn.juce.com/doc/tutorial_new_introjucer_project.php). Instead I will provide those IntroJucer settings that differ from the default ones:

| Introjucer iOS build setting  | Value             |
| ------------------------- | --------------------- |
| Library Type              | `Static Library (.a)`   |
| Additional Modules        | `juce_audio_utils`      |
| iOS Deployment Target     | `7.0`                   |

Nothing very special to mention here. We add one extra Juce module (juce_audio_utils) and limit support to iOS v7.0 and higher.

| Introjucer Android build setting  | Value                |
| -------------------------- | --------------------------- |
| Library Type               | `Dynamic Library (.so)`       |
| Additional Modules         | `juce_audio_utils`            |
| Android Activity Class Name| `com.yourcompany.cocosjucesharedlib.JuceActivity` |
| Minimum SDK Version        | `16 (Android 4.1 Jelly Bean)` |
| External Libraries To Link | `android`                     |
| Architectures              | `armeabi armeabi-v7a x86`     |

For Android we support API 16 or higher (4.1 Jelly Bean and up). We link in an extra android runtime lib and support ARM and x86 32-bit architectures.  Special mention deserves the Android activity class name that needs to be provided.  This will be explained later though when we show how to code the Xamarin Android part.

##### Adding C++ code

Once the IntroJucer projects have been set up, we need to write our C++ classes and add them to the IntroJucer projects. As said earlier you can have both IntroJucer projects include the same .cpp/.h files and make use of the Juce-provided precompiler constants `JUCE_ANDROID` and `JUCE_IOS` to adapt the classes to each platform where needed.

The implementation of the library is relatively trivial and I will not discuss it here in detail.
If you like to see its details, I recommend you inspect the sample projects on github (see link at start of article).


##### Correctly defining the C Exports

An important thing to watch out for (at least on iOS) is that the C interface functions have the proper export attributes.  This caused me major headaches before I found the right one.

The sample code defines a series of `EXPORT_X` macros in `platform.h`

<a href="/img/2015-11-19-cocosjuce/exportusage.png" class="swipebox" title="export usage">
<img src="/img/2015-11-19-cocosjuce/exportusage.png" alt="export usage"></a>

The definitions differ per platform.
On iOS they have to be exactly like this:

<a href="/img/2015-11-19-cocosjuce/iosexports.png" class="swipebox" title="ios exports">
<img src="/img/2015-11-19-cocosjuce/iosexports.png" alt="ios exports" ></a>

And on Android they are trivially:

<a href="/img/2015-11-19-cocosjuce/androidexports.png" class="swipebox" title="android exports">
<img src="/img/2015-11-19-cocosjuce/androidexports.png" alt="android exports"></a>


##### Juce library initialization

###### iOS Juce initialization

on iOS, Juce library initialization is very straigthforward. It suffices to call the Juce-provided static method `juce::initaliseJuce_GUI()` once. 
We'll do this in the constructor of our CocosJuceMain class:

<a href="/img/2015-11-19-cocosjuce/iosinit.png" class="swipebox" title="android exports">
<img src="/img/2015-11-19-cocosjuce/iosinit.png" alt="android exports"></a>


###### Android Juce initialization

On Android, things are a bit different. 

We cannot call `initaliseJuce_GUI()` directly on Android, since this is the privilege of Juce's `AndroidSystem` class.
This AndroidSystem class interacts with a special .java class, also provided by Juce:  `JuceActivity.java`, which is generated by the IntroJucer.
Juce library startup will then be triggered indirectly by this java class on Android app startup. No special actions need to be taken for this on the C++ side, 
but we do need to take some special measures on the Android java side later.  We'll discuss this further in part 2 of this series, which 
deals with the Xamarin side of things.

Apart from that, Android needs an additional `JUCEApplication` class implementation.
This must be provided for linking to succeed.  In our story, it does not play a significant role though.

<a href="/img/2015-11-19-cocosjuce/juceapplicationclass.png" class="swipebox" title="JUCEApplication class">
<img src="/img/2015-11-19-cocosjuce/juceapplicationclass.png" alt="JUCEApplication class"></a>


## Building the headless audio library

Once our IntroJucer projects have been set up properly and all C++ code has been added, it's time to build the binary libs for each platform.

##### Building the iOS libs

For iOS we need to build two libs, one x86 binary for the simulator (build for Profiling) and one universal 32/64 bit ARM binary for the device (build for Archiving).  I used XCode 6.4 during the project.
The result should be two binary static libs, both called `libCocosJuceStaticLib.a`


##### Building the Android libs

For Android we need to build three libs - one for x86, one for ARM and one for ARMV7 - all release builds.
I have used Android SDK 24.3.4 + API 16  and Android NDK r10e.

In order to build, navigate in your bash shell to the Android build directory generated by IntroJucer:

```
cd CocosJuce/CocosJuceSharedLib/Builds/Android
```

Then build with this command:

```
ant release
```

After a while you should find back the following binaries:

```
Android/libs/armeabi/libjuce_jni.so 
Android/libs/armeabi-v7a/libjuce_jni.so 
Android/libs/x86/libjuce_jni.so 
```

While technically not mandatory, we'll rename all of these to `libCocosJuceSharedLib.so` to remain consistent with the iOS version.

## Wrapping up


By the time we've reached this point, we can take a coffee break, as all the native C/C++ library work is now behind us!

In [Part 2](/blog/2015/11/19/cocosjuce-part2.html) of this series we'll examine how to set up the Xamarin/C# side of things, and consume our C++ lib from our UI.


