// Web-element shims so the web screens' JSX runs on React Native with NativeWind.
// div->Box, span/p/h*->T, button->Btn, input->Inp, select/option->Sel/Opt, img->Img.
import React, { createContext, useContext, useState } from 'react';
import {
  View, Text, Pressable, TextInput, Image, Modal, ScrollView, FlatList, TouchableOpacity, Platform, Keyboard,
} from 'react-native';
import { normalize, mergeText, textTokens, gridInfo } from './classes';
import { mediaUrl } from '../lib/config';

const TextCtx = createContext<string[]>([]);
const FormCtx = createContext<null | ((e?: any) => void)>(null);
export const useTextCtx = () => useContext(TextCtx);

export function T({ className = '', children, ...rest }: any) {
  const inh = useTextCtx();
  const tokens = mergeText(inh, className);
  const own = className.split(/\s+/).filter((t: string) => !textTokens(className).includes(t)).join(' ');
  const lines = className.includes('truncate') ? 1 : Number((className.match(/line-clamp-(\d)/) || [])[1]) || undefined;
  return (
    <Text className={normalize(`${tokens.join(' ')} ${own}`)} numberOfLines={lines} {...stripWeb(rest)}>
      {children}
    </Text>
  );
}

const stripWeb = (p: any) => {
  const { onClick, onChange, onKeyDown, onSubmit, htmlFor, dir, title, type, name, id, required, autoComplete, tabIndex, role, href, target, rel, ref, ...r } = p;
  return r;
};

export function Box({ className = '', children, onClick, onPress, onSubmit, style, grid, ...rest }: any) {
  const inh = useTextCtx();
  const merged = mergeText(inh, className);
  const g = gridInfo(className);
  let content = children;
  if (g) {
    const items = React.Children.toArray(children).filter(Boolean);
    const half = g.gap / 2;
    content = items.map((c, i) => (
      <View key={i} style={{ width: `${100 / g.cols}%`, padding: half }}>{c}</View>
    ));
    style = [{ flexDirection: 'row', flexWrap: 'wrap', margin: -half }, style];
  }
  const kids = React.Children.map(content, (c) =>
    typeof c === 'string' || typeof c === 'number' ? ((typeof c === 'string' && !c.trim()) ? null : <T>{c}</T>) : c
  );
  const isOverlay = /(^|\s)fixed(\s|$)/.test(className) && /(^|\s)inset-0(\s|$)/.test(className);
  const cn = normalize(g ? className.replace(/(^|\s)gap-\S+/g, '') : className).replace(/\binset-0\b/, 'flex-1');
  if (isOverlay) {
    return (
      <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <TextCtx.Provider value={merged}>
          <ScrollView style={{ flex: 1 }} contentContainerClassName={cn} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{kids}</ScrollView>
        </TextCtx.Provider>
      </Modal>
    );
  }
  const body = (
    <TextCtx.Provider value={merged}>
      {onClick || onPress ? (
        <Pressable className={cn} style={style} onPress={() => (onPress || onClick)({ stopPropagation() {}, preventDefault() {} })} {...stripWeb(rest)}>{kids}</Pressable>
      ) : (
        <View className={cn} style={style} {...stripWeb(rest)}>{kids}</View>
      )}
    </TextCtx.Provider>
  );
  return onSubmit ? <FormCtx.Provider value={() => onSubmit({ preventDefault() {}, stopPropagation() {} })}>{body}</FormCtx.Provider> : body;
}

export function Btn({ className = '', children, onClick, onPress, disabled, style, type, ...rest }: any) {
  const inh = useTextCtx();
  const submit = useContext(FormCtx);
  const merged = mergeText(inh, className);
  const kids = React.Children.map(children, (c) =>
    typeof c === 'string' || typeof c === 'number' ? ((typeof c === 'string' && !c.trim()) ? null : <T>{c}</T>) : c
  );
  const fire = (onPress || onClick) || (type === 'submit' && submit ? submit : undefined);
  return (
    <TextCtx.Provider value={merged}>
      <Pressable
        disabled={disabled}
        className={normalize(className) + (disabled ? '' : '')}
        style={style}
        onPress={() => { Keyboard.dismiss(); fire && fire({ stopPropagation() {}, preventDefault() {}, currentTarget: {}, target: {} }); }}
        {...stripWeb(rest)}
      >
        {kids}
      </Pressable>
    </TextCtx.Provider>
  );
}

export function Inp({ className = '', type, value, onChange, onChangeText, placeholder, maxLength, autoFocus, disabled, readOnly, rows, multiline, onKeyDown, style, ...rest }: any) {
  const submit = useContext(FormCtx);
  const kb = type === 'tel' ? 'phone-pad' : type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default';
  const cn = normalize(className.replace(/(^|\s)(pl|pr|pt|pb|p|px|py)-\S+/g, (m: string) => m)) ;
  return (
    <TextInput
      className={cn}
      value={value == null ? '' : String(value)}
      onChangeText={(txt) => { onChangeText?.(txt); onChange?.({ target: { value: txt }, currentTarget: { value: txt } }); }}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      maxLength={maxLength}
      autoFocus={false}
      editable={!disabled && !readOnly}
      keyboardType={kb as any}
      secureTextEntry={type === 'password'}
      autoCapitalize={type === 'email' || type === 'password' ? 'none' : 'sentences'}
      multiline={!!rows || multiline}
      numberOfLines={rows}
      textAlignVertical={rows ? 'top' : 'center'}
      onSubmitEditing={() => { onKeyDown?.({ key: 'Enter', preventDefault() {} }); if (!multiline && !rows && submit) submit(); }}
      style={style}
    />
  );
}

export function Opt(_: any) { return null; }

export function Sel({ className = '', value, onChange, children, disabled }: any) {
  const [open, setOpen] = useState(false);
  const opts = React.Children.toArray(children).filter((c: any) => c && c.props).map((c: any) => ({
    value: String(c.props.value ?? c.props.children),
    label: typeof c.props.children === 'string' ? c.props.children : String(c.props.children ?? c.props.value),
    disabled: c.props.disabled,
  }));
  const cur = opts.find((o) => o.value === String(value));
  const cn = normalize(className);
  return (
    <>
      <Pressable disabled={disabled} onPress={() => setOpen(true)} className={`${cn} flex-row items-center justify-between`}>
        <Text className="text-xs font-semibold text-neutral-900" numberOfLines={1}>{cur ? cur.label : ''}</Text>
        <Text className="text-neutral-400 text-xs">▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-t-3xl max-h-[70%] pb-6">
            <View className="items-center py-3"><View className="w-10 h-1 rounded-full bg-slate-200" /></View>
            <FlatList
              data={opts}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  className={`px-5 py-3.5 border-b border-slate-100 ${item.value === String(value) ? 'bg-slate-100' : ''}`}
                  onPress={() => { setOpen(false); onChange?.({ target: { value: item.value }, currentTarget: { value: item.value } }); }}
                >
                  <Text className={`text-sm ${item.value === String(value) ? 'font-extrabold' : 'font-semibold'} text-slate-900`}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function Img({ className = '', src, style, ...rest }: any) {
  if (!src) return null;
  return <Image className={normalize(className)} source={{ uri: mediaUrl(src) }} resizeMode="cover" style={style} />;
}

export function Vid({ className = '', src, style }: any) {
  const { Video, ResizeMode } = require('expo-av');
  if (!src) return null;
  return <Video className={normalize(className)} style={[{ width: '100%', height: '100%' }, style]} source={{ uri: mediaUrl(src) }} useNativeControls resizeMode={ResizeMode.COVER} isMuted />;
}

export function Page({ children, className = '' }: any) {
  return <ScrollView className={className} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}
