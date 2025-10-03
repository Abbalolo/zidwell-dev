import { CgClose } from "react-icons/cg"; 
import { db } from '@/app/firebase/firebaseAuth';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

function EditBlog({ post, toggleEdit, setToggleEdit }: any) {
  const [formData, setFormData] = useState({
    title: '',
    location: "",
    author: {
      name: '',
      avatar: '',
    },
    description: '',
    image: '',
  });

  // Initialize form data when post prop is available
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        location: post.location,
        author: {
          name: post.author.name,
          avatar: post.author.avatarUrl,
        },
        description: post.description,
        image: post.imageUrl,
      });
    }
  }, [post]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('author.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        author: {
          ...prev.author,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle file input changes for author avatar
  const handleImageAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          author: {
            ...prev.author,
            avatar: reader.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file input changes for blog image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const editBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    const blogId = post.id; // Use actual blog ID from post prop
    const updatedData = {
      ...formData,
      updatedAt: new Date(),
    };

    try {
      const blogDocRef = doc(db, 'blogs', blogId);
      await updateDoc(blogDocRef, updatedData);
      toast({
        title: 'Blog updated successfully.',
      });
      setToggleEdit(false); // Close dialog after successful update
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating blog.',
      });
      console.error('Error updating blog:', error);
    }
  };

  return (
    <>
    {/* Edit Blog Button to Trigger Dialog */}
    <button
      onClick={() => setToggleEdit(true)}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    >
      Edit Blog
    </button>
  
    {/* Custom Modal/Dialog */}
    {toggleEdit && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        onClick={() => setToggleEdit(false)} // Close on backdrop click
      >
        <div
          className="bg-white p-6 rounded-md w-[70%] max-h-[80%] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()} // Prevent closing on dialog content click
        >
          <h2 className="text-xl font-bold mb-4">Edit Blog Post</h2>
          <form onSubmit={editBlog} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-md w-full"
                placeholder="Enter the blog title"
                required
              />
            </div>

            <div>
                        <label
                          htmlFor="location"
                          className="block text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="p-2 text-gray-400 outline-none border border-gray-300 dark:border-slate-700 rounded-md bg-transparent focus-visible:ring-0 focus:border-black w-full"
                          placeholder="Enter the blog location"
                          required
                        />
                      </div>
  
            {/* Author */}
            <div>
              <label htmlFor="authorName" className="block text-gray-700 mb-1">
                Author
              </label>
              <input
                type="text"
                id="authorName"
                name="author.name"
                value={formData.author.name}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-md w-full"
                placeholder="Author's name"
                required
              />
            </div>
  
            {/* Author Avatar */}
            <div>
              <label htmlFor="avatar" className="block text-gray-700 mb-1">
                Author Avatar
              </label>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleImageAuthorChange}
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              {formData.author.avatar && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Image Preview:</p>
                  <Image
                    src={formData.author.avatar.toString()}
                    alt="avatar preview"
                    width={40}
                    height={40}
                    priority
                    className="mt-2 rounded-md  w-[100px] object-cover"
                  />
                </div>
              )}
            </div>
  
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-md w-full"
                placeholder="Write your blog description here..."
                required
              ></textarea>
            </div>
  
            {/* Blog Image */}
            <div>
              <label htmlFor="image" className="block text-gray-700 mb-1">
                Blog Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              {formData.image && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Image Preview:</p>
                  <Image
                    src={formData.image.toString()}
                    alt="Blog preview"
                    width={40}
                    height={40}
                    priority
                    className="mt-2 rounded-md w-full max-h-64 object-cover"
                  />
                </div>
              )}
            </div>
  
            {/* Submit Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 w-full"
            >
              Save Blog
            </button>
          </form>
  
          {/* Close Button */}
          <button
            onClick={() => setToggleEdit(false)}
            className="text-sm text-gray-500 hover:text-gray-700 absolute top-3 right-3"
          >
            <CgClose />
          </button>
        </div>
      </div>
    )}
  </>
  
  );
}

export default EditBlog;
