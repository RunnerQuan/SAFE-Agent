# Component Library

ReactBits-inspired components for the pitch experience. All components use Framer Motion and follow the design system.

## Core Components

### 1. GlassCard

Container with glassmorphism effect.

```jsx
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true }) => (
  <motion.div
    className={`
      relative overflow-hidden
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-[20px]
      border border-[rgba(255,255,255,0.1)]
      rounded-[24px]
      shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(255,255,255,0.05)]
      ${className}
    `}
    whileHover={hover ? {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.15)',
      y: -4,
      boxShadow: '0 16px 48px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.08)'
    } : {}}
    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);
```

### 2. TextType

Typewriter text animation with cursor.

```jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TextType = ({
  text,
  typingSpeed = 50,
  className = '',
  showCursor = true,
  cursorChar = '|',
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const textArray = Array.isArray(text) ? text : [text];
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const currentText = textArray[currentIndex];
    if (displayedText.length < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.slice(0, displayedText.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedText, currentIndex, textArray, typingSpeed, onComplete]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="ml-1"
        >
          {cursorChar}
        </motion.span>
      )}
    </span>
  );
};
```

### 3. CircularText

Rotating circular text for taglines.

```jsx
import { motion } from 'framer-motion';

const CircularText = ({
  text,
  size = 200,
  duration = 20,
  className = ''
}) => {
  const letters = text.split('');
  const angleStep = 360 / letters.length;
  
  return (
    <motion.div
      className={`relative rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-0 origin-[0_100px] text-white font-bold text-lg"
          style={{
            transform: `rotate(${i * angleStep}deg)`,
            transformOrigin: `0 ${size / 2}px`
          }}
        >
          {letter}
        </span>
      ))}
    </motion.div>
  );
};
```

### 4. AnimatedCounter

Number counting animation triggered on scroll.

```jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

const AnimatedCounter = ({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  
  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};
```

### 5. ScrollVelocity (Marquee)

Infinite scrolling text that responds to scroll velocity.

```jsx
import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';

const ScrollVelocity = ({
  children,
  baseVelocity = 100,
  className = ''
}) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  
  const directionFactor = useRef(1);
  
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden">
      <motion.div
        className={`flex whitespace-nowrap ${className}`}
        style={{ x: baseX }}
      >
        {[...Array(6)].map((_, i) => (
          <span key={i} className="mr-8">{children}</span>
        ))}
      </motion.div>
    </div>
  );
};
```

### 6. ProgressStepper

Timeline/roadmap visualization.

```jsx
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ProgressStepper = ({ steps, currentStep = 0 }) => (
  <div className="flex items-center w-full">
    {steps.map((step, i) => (
      <div key={i} className="flex items-center flex-1 last:flex-none">
        <motion.div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            font-semibold text-sm border-2 transition-colors
            ${i < currentStep 
              ? 'bg-[#5227FF] border-[#5227FF] text-white' 
              : i === currentStep
                ? 'border-[#5227FF] text-[#5227FF] bg-transparent'
                : 'border-[#333] text-[#666] bg-transparent'}
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring' }}
        >
          {i < currentStep ? <Check size={18} /> : i + 1}
        </motion.div>
        
        {i < steps.length - 1 && (
          <div className="flex-1 h-0.5 mx-3 bg-[#333] relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#5227FF]"
              initial={{ width: 0 }}
              animate={{ width: i < currentStep ? '100%' : '0%' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          </div>
        )}
      </div>
    ))}
  </div>
);
```

### 7. GradientText

Text with gradient fill.

```jsx
const GradientText = ({ children, gradient, className = '' }) => (
  <span
    className={`bg-clip-text text-transparent ${className}`}
    style={{ backgroundImage: gradient || 'linear-gradient(135deg, #5227FF, #22D3EE)' }}
  >
    {children}
  </span>
);
```

### 8. FadeInView

Wrapper that animates children when scrolled into view.

```jsx
import { motion } from 'framer-motion';

const FadeInView = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = '' 
}) => {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 }
  };
  
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.1, 0.25, 1] 
      }}
    >
      {children}
    </motion.div>
  );
};
```

### 9. StaggerContainer

Container that staggers children animations.

```jsx
import { motion } from 'framer-motion';

const StaggerContainer = ({ children, staggerDelay = 0.1, className = '' }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-50px' }}
    variants={{
      visible: {
        transition: { staggerChildren: staggerDelay }
      }
    }}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
      }
    }}
  >
    {children}
  </motion.div>
);
```

### 10. MetricCard

Glassmorphism card with animated metric display.

```jsx
const MetricCard = ({ value, label, prefix = '', suffix = '', icon: Icon }) => (
  <GlassCard className="p-6">
    <div className="flex items-start justify-between mb-4">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[#5227FF]/20 flex items-center justify-center">
          <Icon size={20} className="text-[#5227FF]" />
        </div>
      )}
    </div>
    <AnimatedCounter
      value={value}
      prefix={prefix}
      suffix={suffix}
      className="text-4xl font-bold text-white font-mono"
    />
    <p className="text-[#a3a3a3] mt-2 text-sm">{label}</p>
  </GlassCard>
);
```

## Section Templates

### Hero Section

```jsx
const HeroSection = ({ headline, tagline, subtext }) => (
  <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
    {/* Background */}
    <div 
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at 20% 80%, rgba(82,39,255,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(244,114,182,0.1) 0%, transparent 50%),
          #060010
        `
      }}
    />
    
    {/* Circular tagline */}
    <div className="absolute top-20 right-20">
      <CircularText text={tagline} size={180} />
    </div>
    
    {/* Main content */}
    <div className="relative z-10 text-center max-w-4xl px-6">
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
        <TextType text={headline} typingSpeed={40} />
      </h1>
      <p className="text-xl text-[#a3a3a3] max-w-2xl mx-auto">
        {subtext}
      </p>
    </div>
    
    {/* Scroll indicator */}
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <ChevronDown className="text-[#666]" size={32} />
    </motion.div>
  </section>
);
```

### Metrics Section

```jsx
const MetricsSection = ({ metrics }) => (
  <section className="py-24 relative">
    <div className="max-w-6xl mx-auto px-6">
      <FadeInView>
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Traction & Growth
        </h2>
      </FadeInView>
      
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <StaggerItem key={i}>
            <MetricCard {...metric} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);
```

### Team Section

```jsx
const TeamSection = ({ members }) => (
  <section className="py-24">
    <div className="max-w-6xl mx-auto px-6">
      <FadeInView>
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          The Team
        </h2>
      </FadeInView>
      
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, i) => (
          <StaggerItem key={i}>
            <GlassCard className="p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-[#333] mx-auto mb-4 overflow-hidden">
                {member.image && <img src={member.image} alt={member.name} />}
              </div>
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-[#5227FF] text-sm mb-3">{member.role}</p>
              <p className="text-[#a3a3a3] text-sm">{member.bio}</p>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);
```

## Usage Notes

### Import Pattern
```jsx
// Using Lucide icons
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
```

### Animation Best Practices

1. **Use `whileInView` with `once: true`** for scroll-triggered animations
2. **Set `viewport.margin`** to trigger slightly before element is visible
3. **Keep stagger delays between 80-120ms** for natural feel
4. **Use spring physics** for interactive elements
5. **Respect `prefers-reduced-motion`** by checking `useReducedMotion()`

### Performance

1. Use `will-change` sparingly
2. Prefer `transform` and `opacity` for animations
3. Avoid animating layout properties (width, height, top, left)
4. Use `useTransform` over `useSpring` when possible
5. Lazy load below-fold sections
