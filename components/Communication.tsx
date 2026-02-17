import React, { useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage, User } from '../types';
import { IMAGES } from '../constants';

interface CommunicationProps {
    user: User;
}

// ... Interfaces Post, Comment, PollOption ...
interface PollOption { id: number; text: string; votes: number; }
interface Comment { id: number; author: string; avatar?: string; text: string; timestamp: string; isAdmin?: boolean; }
interface Post { id: number; type: 'notice' | 'poll' | 'message'; author: { name: string; role: string; avatar?: string; }; title: string; content: string; image?: string; timestamp: string; timestampObj: number; pinned?: boolean; urgent?: boolean; likes: number; userLiked?: boolean; pollOptions?: PollOption[]; userVoted?: number | null; commentsCount: number; commentsList: Comment[]; showComments?: boolean; }

// Mock Inicial Simplificado
const INITIAL_POSTS: Post[] = [
  { id: 1, type: 'notice', author: { name: 'Sarah Johnson', role: 'Síndica', avatar: IMAGES.USER_AVATAR }, title: 'Manutenção', content: 'Elevadores parados terça.', timestamp: '2h', timestampObj: Date.now(), likes: 12, userLiked: false, commentsCount: 0, commentsList: [] },
  { id: 2, type: 'poll', author: { name: 'Admin', role: 'Sistema', avatar: IMAGES.ADMIN_TOM }, title: 'Decoração', content: 'Escolham a cor.', timestamp: '1d', timestampObj: Date.now(), pollOptions: [{id:1, text:'Azul', votes:5}, {id:2, text:'Vermelho', votes:2}], userVoted: null, likes: 5, userLiked: false, commentsCount: 0, commentsList: [] }
];

const Communication: React.FC<CommunicationProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Form Creation
  const [newPost, setNewPost] = useState({ type: 'message', title: '', content: '' }); 

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleDeletePost = (id: number) => {
    // Admin deleta tudo. Morador deleta só o seu.
    const target = posts.find(p => p.id === id);
    if (!isAdmin && target?.author.name !== user.name) {
        showToast('Você não tem permissão para excluir este post.', 'error');
        return;
    }
    setPosts(prev => prev.filter(p => p.id !== id));
    showToast('Post removido.');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const post: Post = {
        id: Date.now(),
        type: newPost.type as any,
        author: { name: user.name, role: isAdmin ? 'Síndica' : 'Morador', avatar: user.avatar },
        title: newPost.title,
        content: newPost.content,
        timestamp: 'Agora',
        timestampObj: Date.now(),
        likes: 0,
        commentsCount: 0,
        commentsList: []
    };
    setPosts([post, ...posts]);
    setIsModalOpen(false);
    showToast('Publicado!');
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">{toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mural</h1>
        <button onClick={() => {
            // Reset tipo default ao abrir: Admin pode tudo, Morador só Message
            setNewPost({ type: isAdmin ? 'notice' : 'message', title: '', content: '' });
            setIsModalOpen(true);
        }} className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium">Nova Publicação</button>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex justify-between">
                    <div className="flex gap-3">
                        <img src={post.author.avatar} className="w-10 h-10 rounded-full" />
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{post.author.name}</h3>
                            <p className="text-xs text-slate-500">{post.author.role}</p>
                        </div>
                    </div>
                    {(isAdmin || post.author.name === user.name) && <button onClick={() => handleDeletePost(post.id)} className="text-slate-400 hover:text-red-500"><span className="material-icons">delete</span></button>}
                </div>
                <div className="mt-3">
                    <span className={`text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold uppercase`}>{post.type}</span>
                    <h2 className="text-lg font-bold mt-2 text-slate-900 dark:text-white">{post.title}</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{post.content}</p>
                </div>
                {/* Lógica de Enquete e Likes simplificada para brevidade... */}
            </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Publicação" onSubmit={handleCreatePost} submitLabel="Publicar">
         <div className="space-y-4">
            {isAdmin && (
                <div className="flex gap-2">
                    <button type="button" onClick={() => setNewPost({...newPost, type: 'notice'})} className={`flex-1 p-2 border rounded ${newPost.type === 'notice' ? 'border-primary text-primary' : ''}`}>Comunicado</button>
                    <button type="button" onClick={() => setNewPost({...newPost, type: 'poll'})} className={`flex-1 p-2 border rounded ${newPost.type === 'poll' ? 'border-primary text-primary' : ''}`}>Enquete</button>
                </div>
            )}
            {!isAdmin && <p className="text-sm text-slate-500">Você está postando uma mensagem para a comunidade.</p>}
            
            <input value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full border rounded p-2" placeholder="Título" required />
            <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full border rounded p-2" rows={4} placeholder="Conteúdo" required />
         </div>
      </Modal>
    </div>
  );
};

export default Communication;
